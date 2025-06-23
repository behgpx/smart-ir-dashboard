exports.handler = async (event) => {
  const { comando } = JSON.parse(event.body);
  console.log('Comando recebido:', comando);

  // Aqui você pode redirecionar para seu servidor real
  // ex: await fetch('http://192.168.x.x:3000/comando', {...})

  return {
    statusCode: 200,
    body: `Mock recebido: ${comando}`
  };
};
