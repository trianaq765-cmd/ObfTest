--[[
    ╔═══════════════════════════════════════════════════════════╗
    ║                      MAIN SCRIPT                          ║
    ║              Ini adalah script utama kamu                 ║
    ╚═══════════════════════════════════════════════════════════╝
]]

-- Paste script asli kamu di sini
-- (Script GUI yang kamu tunjukkan sebelumnya)

--// Services
local RS = game:GetService("ReplicatedStorage")
local WS = game:GetService("Workspace")
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")
local LP = Players.LocalPlayer

--// Cleanup
if getgenv().TestGUI then pcall(function() getgenv().TestGUI:Destroy() end) end

--// ... (Lanjutkan dengan script GUI kamu)

print("✅ Main script loaded successfully!")
