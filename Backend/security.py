"""
Enhanced Security Module for Leo Photography Platform
Provides encryption, obfuscation, and security utilities
"""

import os
import hashlib
import hmac
import base64
import jwt
import secrets
from datetime import datetime, timedelta
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from fastapi import HTTPException, Request
from functools import wraps
import logging

logger = logging.getLogger(__name__)

class SecurityManager:
    def __init__(self):
        # Get or generate encryption keys
        self.secret_key = os.getenv("SECURITY_SECRET_KEY")
        if not self.secret_key:
            self.secret_key = secrets.token_urlsafe(32)
            logger.info("Generated new security secret key")
            
        self.jwt_secret = os.getenv("JWT_SECRET_KEY")
        if not self.jwt_secret:
            self.jwt_secret = secrets.token_urlsafe(32)
            logger.info("Generated new JWT secret key")
            
        salt_hex = os.getenv("ENCRYPTION_SALT")
        if salt_hex:
            self.salt = bytes.fromhex(salt_hex)
        else:
            self.salt = secrets.token_bytes(16)
            logger.info("Generated new encryption salt")
        
        # Initialize Fernet encryption
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=self.salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.secret_key.encode()))
        self.cipher_suite = Fernet(key)
        
        # Rate limiting storage
        self.rate_limit_storage = {}
        
    def encrypt_id(self, folder_id: str) -> str:
        """Encrypt folder ID to prevent direct access"""
        try:
            # Add timestamp for additional security
            timestamp = str(int(datetime.now().timestamp()))
            data = f"{folder_id}:{timestamp}"
            encrypted = self.cipher_suite.encrypt(data.encode())
            return base64.urlsafe_b64encode(encrypted).decode()
        except Exception as e:
            logger.error(f"Encryption error: {e}")
            raise HTTPException(status_code=500, detail="Security error")
    
    def decrypt_id(self, encrypted_id: str) -> str:
        """Decrypt folder ID and validate timestamp"""
        try:
            encrypted_data = base64.urlsafe_b64decode(encrypted_id.encode())
            decrypted = self.cipher_suite.decrypt(encrypted_data).decode()
            folder_id, timestamp = decrypted.split(':', 1)
            
            # Validate timestamp (24 hours expiry)
            token_time = datetime.fromtimestamp(int(timestamp))
            if datetime.now() - token_time > timedelta(hours=24):
                raise HTTPException(status_code=401, detail="Token expired")
            
            return folder_id
        except Exception as e:
            logger.error(f"Decryption error: {e}")
            raise HTTPException(status_code=401, detail="Invalid token")
    
    def generate_secure_token(self, data: dict, expiry_hours: int = 24) -> str:
        """Generate secure JWT token"""
        payload = {
            **data,
            'exp': datetime.utcnow() + timedelta(hours=expiry_hours),
            'iat': datetime.utcnow(),
            'jti': secrets.token_urlsafe(16)  # Unique token ID
        }
        return jwt.encode(payload, self.jwt_secret, algorithm='HS256')
    
    def verify_token(self, token: str) -> dict:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
    
    def hash_password(self, password: str) -> str:
        """Hash password with salt"""
        salt = secrets.token_hex(16)
        pwdhash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return f"{salt}:{pwdhash.hex()}"
    
    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verify password against hash"""
        try:
            salt, stored_hash = password_hash.split(':')
            pwdhash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
            return stored_hash == pwdhash.hex()
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False
    
    def create_api_key(self, user_id: str, permissions: list = None) -> str:
        """Create secure API key"""
        data = {
            'user_id': user_id,
            'permissions': permissions or [],
            'key_type': 'api_key'
        }
        return self.generate_secure_token(data, expiry_hours=24*30)  # 30 days
    
    def validate_request_signature(self, request_data: str, signature: str) -> bool:
        """Validate HMAC signature for API requests"""
        expected_signature = hmac.new(
            self.secret_key.encode(),
            request_data.encode(),
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(signature, expected_signature)
    
    def rate_limit_check(self, client_ip: str, endpoint: str, limit: int = 100, window: int = 3600) -> bool:
        """Rate limiting check"""
        now = datetime.now().timestamp()
        key = f"{client_ip}:{endpoint}"
        
        if key not in self.rate_limit_storage:
            self.rate_limit_storage[key] = []
        
        # Clean old requests outside window
        self.rate_limit_storage[key] = [
            req_time for req_time in self.rate_limit_storage[key] 
            if now - req_time < window
        ]
        
        if len(self.rate_limit_storage[key]) >= limit:
            return False
        
        self.rate_limit_storage[key].append(now)
        return True
    
    def sanitize_filename(self, filename: str) -> str:
        """Sanitize filename to prevent path traversal"""
        import re
        # Remove dangerous characters
        filename = re.sub(r'[<>:"/\\|?*]', '', filename)
        # Remove path separators
        filename = filename.replace('..', '')
        return filename

# Global security manager instance
security_manager = SecurityManager()

# Decorators for security
def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    async def decorated_function(request: Request, *args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise HTTPException(status_code=401, detail="Authentication required")
        
        token = auth_header.split(' ')[1]
        payload = security_manager.verify_token(token)
        request.state.user = payload
        return await f(request, *args, **kwargs)
    return decorated_function

def rate_limit(limit: int = 100, window: int = 3600):
    """Decorator for rate limiting"""
    def decorator(f):
        @wraps(f)
        async def decorated_function(request: Request, *args, **kwargs):
            client_ip = request.client.host
            endpoint = f"{request.method}:{request.url.path}"
            
            if not security_manager.rate_limit_check(client_ip, endpoint, limit, window):
                raise HTTPException(status_code=429, detail="Rate limit exceeded")
            
            return await f(request, *args, **kwargs)
        return decorated_function
    return decorator

def validate_folder_access(f):
    """Decorator to validate encrypted folder access"""
    @wraps(f)
    async def decorated_function(encrypted_folder_id: str = None, folder_id: str = None, *args, **kwargs):
        if encrypted_folder_id:
            # Decrypt and validate folder ID
            real_folder_id = security_manager.decrypt_id(encrypted_folder_id)
            kwargs['folder_id'] = real_folder_id
        elif folder_id:
            # For backward compatibility, but log warning
            logger.warning(f"Unencrypted folder ID used: {folder_id}")
        
        return await f(*args, **kwargs)
    return decorated_function
