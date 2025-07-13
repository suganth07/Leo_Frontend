"use client"

import {supabase} from "@/lib/supabase";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { FolderOpen, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import CryptoJS from 'crypto-js'; // Add this import

export default function AdminSettings() {
    const [adminPass, setAdminPass] = useState<string>("");
    const [isopen, setIsOpen] = useState<boolean>(false);
    const [newPassword, setNewPassword] = useState<string>("");

    useEffect(() => {
        async function fetchAdminPass() {
            const { data, error } = await supabase
            .from("admin_controls")
            .select("password")
            .single();
            if (data && data.password) {
                setAdminPass(data.password);
            }
        }
        fetchAdminPass();
    }, []);
    const handleChangePassword = async () => {
        if (!newPassword.trim()) {
            toast.success("Please enter a new password");
            return;
        }
        
        try {
            // Encrypt password before storing
            const encryptedPassword = CryptoJS.AES.encrypt(
                newPassword, 
                process.env.NEXT_PUBLIC_PASSWORD_ENCRYPTION_KEY || 'default-encryption-key'
            ).toString();
            
            const { data, error } = await supabase.rpc('update_admin_password', {
                new_password: encryptedPassword,
                ori_pass: newPassword
            });
            
            if (error) {
                console.error("Error in RPC call:", error);
                throw error;
            }

            setAdminPass(encryptedPassword);
            setNewPassword("");
            setIsOpen(false);
            toast.success("Password updated successfully");
        } catch (error) {
            console.error("Error updating password:", error);
            setIsOpen(false);
            toast.error("Failed to update password. You may need to enable the appropriate function in Supabase.");
        }
    };
    
    // Display decrypted password in UI when needed
    const getDisplayPassword = () => {
        try {
            if (!adminPass) return "";
            // Try to decrypt - this will only work for passwords stored after implementation
            const decryptedBytes = CryptoJS.AES.decrypt(
                adminPass,
                process.env.NEXT_PUBLIC_PASSWORD_ENCRYPTION_KEY || 'default-encryption-key'
            );
            return decryptedBytes.toString(CryptoJS.enc.Utf8) || "[encrypted]";
        } catch (error) {
            return "[encrypted]"; // For passwords that were stored before encryption was added
        }
    };
    
    if (isopen) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Change Admin Password</CardTitle>
                </CardHeader>
                <CardContent>
                    <Input 
                        placeholder="Enter New Password" 
                        id="newpass" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                    />
                    <div className="flex gap-2 mt-4">
                        <Button onClick={() => setIsOpen(false)}>Close</Button>
                        <Button onClick={() => {handleChangePassword()}}>Update Password</Button>
                    </div>
                </CardContent>
            </Card>
        );
    }


    if (!adminPass) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Loading...</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Please wait while we fetch the admin password.</p>
                </CardContent>
            </Card>
        );
    }
    

    return (
        <div className="space-y-6">
          <Card className="border border-red-700">
            <CardHeader>
              <CardTitle className="flex gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Admin Controls
              </CardTitle>
              <CardDescription>
                Change the admin password
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <h1 className="text-center">Current password: {getDisplayPassword()}</h1>
              <Button onClick={() => setIsOpen(true)}>
                Change Password
              </Button>
            </CardContent>
          </Card>
        </div>
    );
}

