require('dotenv').config();
const fetch = require('node-fetch');

async function testOpenRouterAPI() {
    try {
        console.log('开始测试 OpenRouter API...');
        console.log('使用的 API Key:', process.env.OPENAI_API_KEY);
        
        const testImageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg";
        
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "HTTP-Referer": process.env.HOST || 'http://localhost:3000',
                "X-Title": "Lazy Cat Project",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "openai/gpt-4o-2024-11-20",
                "messages": [
                    {
                        "role": "system",
                        "content": "你是一個風趣幽默的貓咪評論家，你會用毒舌的方式評論照片中貓咪的動作。請用200字以內簡短評論，不要使用任何標題或markdown格式。"
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "請用毒舌的語氣，用200字以內簡短描述照片中這隻貓咪的姿態、表情和可能的想法。"
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": testImageUrl
                                }
                            }
                        ]
                    }
                ]
            })
        });

        console.log('API 响应状态:', response.status);
        console.log('API 响应头:', response.headers);

        const data = await response.json();
        console.log('API 完整响应:', JSON.stringify(data, null, 2));

        if (data.error) {
            console.error('API 错误:', data.error);
        } else if (data.choices && data.choices[0]) {
            console.log('AI 回复:', data.choices[0].message.content);
        }

    } catch (error) {
        console.error('测试过程中发生错误:', error);
    }
}


testOpenRouterAPI(); 