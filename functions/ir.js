const fetch = require("node-fetch");
const crypto = require("crypto");

const CLIENT_ID = "8sq7fqrc7ajcve9aewcx";
const CLIENT_SECRET = "0be8748bc29343bcbe4cb8d83915fff8";

const DEVICE_IDS = {
  tv: "ebf86f302f435f9a1c0lbs",
  ar: "eb09c8cc7878efca246sgq"
};

let cachedToken = null;
let tokenExpires = 0;

function sign(clientId, secret, timestamp) {
  const str = clientId + timestamp;
  return crypto.createHmac("sha256", secret).update(str).digest("hex").toUpperCase();
}

async function getToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpires) return cachedToken;

  const t = now.toString();
  const res = await fetch("https://openapi.tuyaus.com/v1.0/token?grant_type=1", {
    headers: {
      "client_id": CLIENT_ID,
      "sign_method": "HMAC-SHA256",
      "t": t,
      "sign": sign(CLIENT_ID, CLIENT_SECRET, t)
    }
  });

  const data = await res.json();
  cachedToken = data.result.access_token;
  tokenExpires = now + (data.result.expire_time * 1000) - 60000;
  return cachedToken;
}

async function sendCommand(deviceId, code, value) {
  const token = await getToken();

  const res = await fetch(`https://openapi.tuyaus.com/v1.0/devices/${deviceId}/commands`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "client_id": CLIENT_ID
    },
    body: JSON.stringify({
      commands: [{ code, value }]
    })
  });

  return res.json();
}

exports.handler = async (event) => {
  try {
    const { comando } = JSON.parse(event.body);

    // Mapeia o comando vindo do botão do painel
    let deviceId, code, value;

    switch (comando) {
      case "tv_power":
        deviceId = DEVICE_IDS.tv;
        code = "power"; value = true;
        break;

      case "ac_power":
        deviceId = DEVICE_IDS.ar;
        code = "switch"; value = true;
        break;

      case "ac_temp_18":
      case "ac_temp_20":
      case "ac_temp_22":
      case "ac_temp_24":
      case "ac_temp_26":
        deviceId = DEVICE_IDS.ar;
        code = "temp_set";
        value = parseInt(comando.split("_")[2]);
        break;

      case "ac_mode_cool":
      case "ac_mode_heat":
      case "ac_mode_dry":
      case "ac_mode_fan":
        deviceId = DEVICE_IDS.ar;
        code = "mode";
        value = comando.split("_")[2]; // cool, heat, dry, fan
        break;

      default:
        return { statusCode: 400, body: "Comando não reconhecido" };
    }

    const result = await sendCommand(deviceId, code, value);
    return { statusCode: 200, body: JSON.stringify(result) };

  } catch (err) {
    return { statusCode: 500, body: `Erro: ${err.message}` };
  }
};
