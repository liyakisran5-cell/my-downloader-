exports.handler = async function (event) {
  const videoUrl = event.queryStringParameters?.url;

  if (!videoUrl) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: false, message: "URL missing" }),
    };
  }

  try {
    const apiUrl =
      "https://batgpt.vercel.app/api/alldl?url=" +
      encodeURIComponent(videoUrl);

    const response = await fetch(apiUrl);
    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: false, message: err.message }),
    };
  }
};
