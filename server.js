const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ═══════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════
const CONFIG = {
    SECRET_KEY: process.env.SECRET_KEY || 'YOUR_SUPER_SECRET_KEY_HERE',
    SCRIPT_VERSION: '14.4.2',
    OBFUSCATOR_NAME: 'Luraph Obfuscator',
    WEBSITE: 'https://lura.ph/'
};

// ═══════════════════════════════════════
// WHITELIST DATABASE
// ═══════════════════════════════════════
const WHITELIST = {
    "123456789": { 
        key: "KEY-XXXX-XXXX-XXXX", 
        expires: Date.now() + (30 * 24 * 60 * 60 * 1000),
        hwid: null
    }
};

// ═══════════════════════════════════════
// WORKING OBFUSCATOR - SUPPORT LOADSTRING
// ═══════════════════════════════════════

class WorkingObfuscator {
    constructor(config = {}) {
        this.name = config.name || 'Luraph Obfuscator';
        this.version = config.version || '14.4.2';
        this.website = config.website || 'https://lura.ph/';
    }

    // Generate random variable name
    randomVar(len = 1) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = chars[Math.floor(Math.random() * 52)];
        for (let i = 1; i < len; i++) {
            result += chars[Math.floor(Math.random() * 52)];
        }
        return result;
    }

    // ═══════════════════════════════════════
    // METHOD 1: XOR + HEX ENCODING (SIMPLE & WORKING)
    // ═══════════════════════════════════════
    obfuscateSimple(code) {
        const key = Math.floor(Math.random() * 200) + 50;
        const seed = Math.floor(Math.random() * 99999);
        
        // XOR encrypt
        let hexData = '';
        for (let i = 0; i < code.length; i++) {
            const byte = code.charCodeAt(i) ^ key ^ (i % 256);
            hexData += byte.toString(16).padStart(2, '0');
        }

        return `--[[ 
    This file was protected using ${this.name} v${this.version} [${this.website}]
    Seed: ${seed}
]]

return(function()
    local a,b,c,d=string.char,string.byte,string.sub,string.gsub
    local e="${hexData}"
    local f=${key}
    local g=""
    local h=0
    for i in e:gmatch("..") do
        local j=tonumber(i,16)
        local k=bit32.bxor(j,f,h%256)
        g=g..a(k)
        h=h+1
    end
    return loadstring(g)()
end)()`;
    }

    // ═══════════════════════════════════════
    // METHOD 2: BYTECODE TABLE (LURAPH STYLE)
    // ═══════════════════════════════════════
    obfuscateBytecode(code) {
        const seed = Math.floor(Math.random() * 99999);
        const key = Math.floor(Math.random() * 200) + 50;
        
        // Convert to byte array with XOR
        let bytes = [];
        for (let i = 0; i < code.length; i++) {
            const byte = code.charCodeAt(i) ^ key ^ (i % 256);
            bytes.push(byte);
        }
        
        // Split into chunks for readability
        const chunkSize = 20;
        let chunks = [];
        for (let i = 0; i < bytes.length; i += chunkSize) {
            chunks.push(bytes.slice(i, i + chunkSize).join(','));
        }

        return `--[[ 
    This file was protected using ${this.name} v${this.version} [${this.website}]
]]

return(function()
    local i,E,L,T,A,m,g=string.byte,string.sub,string.char,string.gsub,string.rep,setmetatable,pcall
    local F={}
    for J=0,255 do F[J]=L(J)end
    local K=${key}
    local D={${chunks.join(',\n    ')}}
    local S=""
    local P=0
    for _,V in ipairs(D)do
        local B=bit32.bxor(V,K,P%256)
        S=S..F[B]
        P=P+1
    end
    return loadstring(S)()
end)()`;
    }

    // ═══════════════════════════════════════
    // METHOD 3: BASE64 + XOR (COMPACT)
    // ═══════════════════════════════════════
    obfuscateBase64(code) {
        const seed = Math.floor(Math.random() * 99999);
        const key = Math.floor(Math.random() * 200) + 50;
        
        // XOR encrypt first
        let encrypted = '';
        for (let i = 0; i < code.length; i++) {
            encrypted += String.fromCharCode(code.charCodeAt(i) ^ key ^ (i % 256));
        }
        
        // Base64 encode
        const base64 = Buffer.from(encrypted, 'binary').toString('base64');

        return `--[[ 
    This file was protected using ${this.name} v${this.version} [${this.website}]
]]

return(function()
    local i,E,L,T,A,m,g,v,I,Q,j=string.byte,string.sub,string.char,string.gsub,string.rep,setmetatable,pcall,type,tostring,assert,loadstring
    local F={}for J=0,255 do F[J]=L(J)end
    local K=${key}
    local B="${base64}"
    local function D(d)
        local e=""
        local f="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
        d=T(d,"[^"..f.."=]","")
        for h in d:gmatch(".")do
            if h~="="then
                local k=f:find(h)-1
                for l=6,1,-1 do
                    e=e..(k%2^l-k%2^(l-1)>0 and"1"or"0")
                end
            end
        end
        local n=""
        for h in e:gmatch(A(".",8))do
            if#h==8 then
                local o=0
                for p=1,8 do o=o+(E(h,p,p)=="1"and 2^(8-p)or 0)end
                n=n..L(o)
            end
        end
        return n
    end
    local S=D(B)
    local R=""
    for q=1,#S do
        local r=i(S,q)
        local s=bit32.bxor(r,K,(q-1)%256)
        R=R..F[s]
    end
    return j(R)()
end)()`;
    }

    // ═══════════════════════════════════════
    // METHOD 4: PROFESSIONAL LURAPH STYLE (FULL)
    // ═══════════════════════════════════════
    obfuscateProfessional(code) {
        const seed = Math.floor(Math.random() * 99999);
        const key1 = Math.floor(Math.random() * 200) + 50;
        const key2 = Math.floor(Math.random() * 200) + 50;
        
        // Double XOR encrypt
        let encrypted = '';
        for (let i = 0; i < code.length; i++) {
            const b = code.charCodeAt(i);
            const e = b ^ key1 ^ ((i * 7) % 256) ^ key2;
            encrypted += String.fromCharCode(e);
        }
        
        // Base64 encode
        const base64 = Buffer.from(encrypted, 'binary').toString('base64');
        
        // Split base64 for readability (76 chars per line like real Luraph)
        let formattedBase64 = '';
        for (let i = 0; i < base64.length; i += 76) {
            formattedBase64 += base64.slice(i, i + 76);
            if (i + 76 < base64.length) formattedBase64 += '\n';
        }

        return `--[[ 
    This file was protected using ${this.name} v${this.version} [${this.website}]
]]

return(function()local i,E,L,T,A,m,g,v,I,Q,j,W,O,F=string.byte,string.sub,string.char,string.gsub,string.rep,setmetatable,pcall,type,tostring,assert,loadstring,unpack,string.pack,{};for J=0,255 do F[J]=L(J);end;local F=${seed};do local J={F,{0x1B,0x4C,0x75,0x61,0x50},I(j)};for e,_ in next,J do local J={g(j,e%2==0 and""or"",nil,nil)};end;end;local J,e,_=(function(q)local x="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";q=T(q,"[^"..x.."=]","");local y="";for z in q:gmatch(".")do if z~="="then local w=x:find(z)-1;for u=6,1,-1 do y=y..(w%2^u-w%2^(u-1)>0 and"1"or"0");end;end;end;local r="";for z in y:gmatch(A(".",8))do if#z==8 then local s=0;for t=1,8 do s=s+(E(z,t,t)=="1"and 2^(8-t)or 0);end;r=r..L(s);end;end;return r;end)([=[${formattedBase64}]=]);local K1,K2=${key1},${key2};local R="";for q=1,#J do local x=i(J,q);local y=bit32.bxor(x,K1,(q-1)*7%256,K2);R=R..L(y);end;return j(R)();end)()`;
    }

    // ═══════════════════════════════════════
    // METHOD 5: ULTRA COMPACT (MINIMAL SIZE)
    // ═══════════════════════════════════════
    obfuscateCompact(code) {
        const key = Math.floor(Math.random() * 200) + 50;
        
        // XOR and convert to escaped string
        let escaped = '';
        for (let i = 0; i < code.length; i++) {
            const byte = code.charCodeAt(i) ^ key ^ (i % 256);
            escaped += '\\' + byte.toString(8).padStart(3, '0');
        }

        return `--[=[${this.name} v${this.version}]=]return(function()local a,b,c=${key},0,""for d in("${escaped}"):gmatch(".")do local e=d:byte()local f=bit32.bxor(e,a,b%256)c=c..string.char(f)b=b+1 end return loadstring(c)()end)()`;
    }

    // ═══════════════════════════════════════
    // METHOD 6: VM-STYLE (ADVANCED)
    // ═══════════════════════════════════════
    obfuscateVM(code) {
        const seed = Math.floor(Math.random() * 99999);
        const key = Math.floor(Math.random() * 200) + 50;
        
        // Encrypt code
        let bytes = [];
        for (let i = 0; i < code.length; i++) {
            bytes.push(code.charCodeAt(i) ^ key ^ (i % 256));
        }
        
        // Format bytes
        const bytesStr = bytes.join(',');

        return `--[[ 
    This file was protected using ${this.name} v${this.version} [${this.website}]
]]

return(function()
    local i,E,L,T,A,m,g,v,I,Q,j,W,O,F=string.byte,string.sub,string.char,string.gsub,string.rep,setmetatable,pcall,type,tostring,assert,loadstring,unpack,string.pack,{}
    for J=0,255 do F[J]=L(J)end
    local _ENV=setmetatable({},{__index=function(_,k)return rawget(_G,k)or rawget(getfenv(),k)end})
    local K=${key}
    local D={${bytesStr}}
    local S=""
    for P=1,#D do
        local B=bit32.bxor(D[P],K,(P-1)%256)
        S=S..F[B]
    end
    local fn,err=j(S)
    if not fn then error(err)end
    return fn()
end)()`;
    }

    // ═══════════════════════════════════════
    // MAIN OBFUSCATE FUNCTION
    // ═══════════════════════════════════════
    obfuscate(code, style = 'professional') {
        switch (style) {
            case 'simple':
                return this.obfuscateSimple(code);
            case 'bytecode':
                return this.obfuscateBytecode(code);
            case 'base64':
                return this.obfuscateBase64(code);
            case 'professional':
                return this.obfuscateProfessional(code);
            case 'compact':
                return this.obfuscateCompact(code);
            case 'vm':
                return this.obfuscateVM(code);
            default:
                return this.obfuscateProfessional(code);
        }
    }
}

// Create instance
const obfuscator = new WorkingObfuscator({
    name: CONFIG.OBFUSCATOR_NAME,
    version: CONFIG.SCRIPT_VERSION,
    website: CONFIG.WEBSITE
});

// ═══════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════

app.get('/', (req, res) => {
    res.json({ 
        status: 'online', 
        version: CONFIG.SCRIPT_VERSION,
        obfuscator: CONFIG.OBFUSCATOR_NAME,
        styles: ['simple', 'bytecode', 'base64', 'professional', 'compact', 'vm']
    });
});

// Load with auth
app.get('/load', async (req, res) => {
    try {
        const { key, userid, hwid, style } = req.query;
        
        if (!key || !userid) {
            return res.status(400).json({ success: false, error: 'Missing parameters' });
        }
        
        const user = WHITELIST[userid];
        if (!user || user.key !== key) {
            return res.status(403).json({ success: false, error: 'Invalid key' });
        }
        
        if (user.expires < Date.now()) {
            return res.status(403).json({ success: false, error: 'Key expired' });
        }
        
        if (user.hwid && user.hwid !== hwid) {
            return res.status(403).json({ success: false, error: 'HWID mismatch' });
        }
        
        if (!user.hwid && hwid) user.hwid = hwid;
        
        const scriptPath = path.join(__dirname, 'scripts', 'main.lua');
        let script = fs.existsSync(scriptPath) 
            ? fs.readFileSync(scriptPath, 'utf8')
            : `print("Script loaded! User: ${userid}")`;
        
        const obfuscated = obfuscator.obfuscate(script, style || 'professional');
        
        res.json({
            success: true,
            version: CONFIG.SCRIPT_VERSION,
            data: obfuscated
        });
        
    } catch (error) {
        console.error('Load error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Raw endpoint
app.get('/raw', (req, res) => {
    try {
        const { secret, style } = req.query;
        
        if (secret !== CONFIG.SECRET_KEY) {
            return res.status(403).send('-- Forbidden');
        }
        
        const scriptPath = path.join(__dirname, 'scripts', 'main.lua');
        if (!fs.existsSync(scriptPath)) {
            return res.status(404).send('-- Script not found');
        }
        
        const script = fs.readFileSync(scriptPath, 'utf8');
        const obfuscated = obfuscator.obfuscate(script, style || 'professional');
        
        res.type('text/plain').send(obfuscated);
        
    } catch (error) {
        res.status(500).send('-- Error');
    }
});

// Obfuscate custom
app.post('/obfuscate', (req, res) => {
    try {
        const { secret, code, style, name, version, website } = req.body;
        
        if (secret !== CONFIG.SECRET_KEY) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        
        if (!code) {
            return res.status(400).json({ error: 'No code provided' });
        }
        
        const customObf = new WorkingObfuscator({
            name: name || CONFIG.OBFUSCATOR_NAME,
            version: version || CONFIG.SCRIPT_VERSION,
            website: website || CONFIG.WEBSITE
        });
        
        const obfuscated = customObf.obfuscate(code, style || 'professional');
        
        res.json({
            success: true,
            obfuscated: obfuscated,
            originalSize: code.length,
            obfuscatedSize: obfuscated.length
        });
        
    } catch (error) {
        res.status(500).json({ error: 'Obfuscation failed' });
    }
});

// Generate key
app.post('/admin/generate-key', (req, res) => {
    const { secret, userid, days } = req.body;
    
    if (secret !== CONFIG.SECRET_KEY) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    
    const newKey = `KEY-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    WHITELIST[userid] = {
        key: newKey,
        expires: Date.now() + ((days || 30) * 24 * 60 * 60 * 1000),
        hwid: null
    };
    
    res.json({ success: true, userid, key: newKey });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔐 Working Obfuscator Ready`);
});
