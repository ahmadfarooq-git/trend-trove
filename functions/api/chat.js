// Use the 'context' object which contains { request, env, params, waitUntil }
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // 1. Parse the incoming request
    const { history, context: systemContext } = await request.json();

    // 2. Access key directly from env
    const apiKey = env.GROQ_API_KEY;
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key not found in environment." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. Format messages for Groq
    const messages = [{ role: "system", content: systemContext }];
    for (const msg of history) {
      messages.push({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.text
      });
    }

    // 4. Call Groq
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        temperature: 0.7,
        max_tokens: 150
      })
    });

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || "Groq Error" }), { status: 500 });
    }

    return new Response(JSON.stringify({ reply: data.choices[0].message.content }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
