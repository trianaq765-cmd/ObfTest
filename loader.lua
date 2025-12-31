--[[
    ╔═══════════════════════════════════════════════════════════╗
    ║              SECURE SCRIPT LOADER v2.0                    ║
    ║           Advanced Obfuscation Support                    ║
    ╚═══════════════════════════════════════════════════════════╝
]]

local CONFIG = {
    KEY = "KEY-XXXX-XXXX-XXXX",
    SERVER_URL = "https://your-app.onrender.com",
    GITHUB_RAW = "https://raw.githubusercontent.com/USERNAME/REPO/main/",
    OBFUSCATION_LEVEL = 5,
    DEBUG = false
}

-- Services
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local LP = Players.LocalPlayer

-- Utilities
local function Log(...)
    if CONFIG.DEBUG then print("[LOADER]", ...) end
end

local function Notify(title, text, duration)
    pcall(function()
        game:GetService("StarterGui"):SetCore("SendNotification", {
            Title = title, Text = text, Duration = duration or 5
        })
    end)
end

-- HWID Generation
local function GetHWID()
    local data = {}
    pcall(function() data.executor = identifyexecutor and identifyexecutor() or "Unknown" end)
    pcall(function() data.jobId = game.JobId end)
    pcall(function() data.placeId = game.PlaceId end)
    pcall(function()
        if gethwid then data.hwid = gethwid()
        elseif get_hwid then data.hwid = get_hwid()
        elseif HWID then data.hwid = HWID end
    end)
    
    local str = ""
    for k, v in pairs(data) do str = str .. tostring(k) .. tostring(v) end
    local hash = 0
    for i = 1, #str do hash = (hash * 31 + string.byte(str, i)) % 2147483647 end
    return string.format("%08x", hash)
end

-- Bytecode Decoder (untuk format obfuscation baru)
local function DecodeBytecode(data, seed)
    local result = ""
    local index = 0
    for _, chunk in pairs(data) do
        if type(chunk) == "table" then
            for _, byte in ipairs(chunk) do
                index = index + 1
                local decoded = bit32.bxor(byte, (index + seed) % 256)
                result = result .. string.char(decoded)
            end
        end
    end
    return result
end

-- Main Loader
local function LoadScript()
    Notify("🔄 Loading", "Connecting to server...", 3)
    Log("Starting loader v2.0...")
    
    local userId = tostring(LP.UserId)
    local hwid = GetHWID()
    local executor = identifyexecutor and identifyexecutor() or "Unknown"
    
    Log("User ID:", userId)
    Log("HWID:", hwid)
    
    local url = CONFIG.SERVER_URL .. "/load?" .. 
        "key=" .. HttpService:UrlEncode(CONFIG.KEY) ..
        "&userid=" .. HttpService:UrlEncode(userId) ..
        "&hwid=" .. HttpService:UrlEncode(hwid) ..
        "&executor=" .. HttpService:UrlEncode(executor) ..
        "&level=" .. CONFIG.OBFUSCATION_LEVEL
    
    local success, response = pcall(function()
        return game:HttpGet(url)
    end)
    
    if not success then
        Log("Request failed:", response)
        Notify("⚠️ Warning", "Main server down, using backup...", 3)
        
        local fallbackSuccess, fallbackResponse = pcall(function()
            return game:HttpGet(CONFIG.GITHUB_RAW .. "script.lua")
        end)
        
        if fallbackSuccess then
            local execSuccess, execError = pcall(function()
                return loadstring(fallbackResponse)()
            end)
            if not execSuccess then
                Notify("❌ Error", "Fallback execution failed", 5)
            end
            return
        else
            Notify("❌ Error", "All servers unreachable", 5)
            return
        end
    end
    
    local data
    local parseSuccess = pcall(function()
        data = HttpService:JSONDecode(response)
    end)
    
    if not parseSuccess then
        Log("Parse failed, trying direct execution...")
        pcall(function() loadstring(response)() end)
        return
    end
    
    if not data.success then
        Log("Server error:", data.error)
        Notify("❌ " .. (data.error or "Error"), "Access denied", 5)
        return
    end
    
    Log("Response success, version:", data.version)
    Notify("✅ Success", "Loading script v" .. data.version, 3)
    
    -- Execute obfuscated script
    local execSuccess, execError = pcall(function()
        return loadstring(data.data)()
    end)
    
    if not execSuccess then
        Log("Execution failed:", execError)
        Notify("❌ Error", "Script execution failed", 5)
    end
end

-- Anti-Tamper
local function ProtectLoader()
    local originalLoadstring = loadstring
    task.spawn(function()
        while true do
            if loadstring ~= originalLoadstring then
                LP:Kick("Tampering detected")
                break
            end
            task.wait(1)
        end
    end)
end

-- Execute
ProtectLoader()
LoadScript()
