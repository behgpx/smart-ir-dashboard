const fetch = require("node-fetch");

const SMART_IR_IP = "191.205.228.228"; // IP do seu Smart IR

const COMMANDS = {
  tv_power: { device: "tv", action: "power" },
  ac_power: { device: "ac", action: "power" },
  ac_mode_cool: { device: "ac", action: "mode", value: "cool" },
  ac_mode_heat: { device: "ac", action: "mode", value: "heat" },
  ac_mode_dry: { device: "ac", action: "mode", value: "dry" },
  ac_mode_fan: { device: "ac", action: "mode", value: "fan" },
  // temperaturas de 18 a 30
  ...Object.fromEntries(Array.from({length: 13}, (_, i) => {
    const temp = 18 + i;
    return [`ac_temp_${temp}`, { device: "ac", action: "temp", value: temp }];
  }))
};

exports.handler = async (event) => {
  try {
    const { comando } = JSON.parse(event.body);
    const payload = COMMANDS[comando];

    if (!payload) {
      return { statusCode: 400, body: "Comando inválido" };
    }

    const res = await fetch(`http://${SMART_IR_IP}/ir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.text();
    return {
      statusCode: 200,
      body: data
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: `Erro: ${err.message}`
    };
  }
};
