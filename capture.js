const puppeteer = require('puppeteer');
const fs = require('fs');
const { WebhookClient } = require('discord.js');

const jobName       = process.argv[2];
const buildNumber   = process.argv[3];
const buildResult   = process.argv[4];
const branchBuild   = process.argv[5];
const webHook       = process.argv[6];
const buildDuration = process.argv[7];
const buildUrl      = process.argv[8];


async function captureScreenshotAndSend() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:8080/login'); // Página de login do Jenkins
    
    // Preencher formulário de login
    await page.type('#j_username', 'admin'); // Substitua 'seu-usuario' pelo nome de usuário do Jenkins
    await page.type('#j_password', 'admin'); // Substitua 'sua-senha' pela senha do Jenkins
    await Promise.all([
        page.click('form[name="login"] > button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]); // Enviar formulário de login

    await page.goto(`http://localhost:8080/job/${jobName}/${buildNumber}/allure/`);
    // Ir para a página do relatório Allure após o login
    await page.setViewport({
        width: 1920, // Largura da tela
        height: 1080, // Altura da tela
    });

    // Capturar a screenshot da página
    await page.screenshot({ path: 'screenshot.png' });

    const webhook = new WebhookClient({ url: '' + webHook });

    const statusEmoji = {
    SUCCESS: "✅",
    FAILURE: "❌",
    UNSTABLE: "⚠️",
    ABORTED: "⏹️"
};

    let message = `
    ━━━━━━━━━━━━━━━━━━━━━━
    🧪 **RELATÓRIO DE TESTES – API**
    ━━━━━━━━━━━━━━━━━━━━━━
    
    🌿 **Branch:** \`${branchBuild}\`
    🏗️ **Build:** \`#${buildNumber}\`
    ${statusEmoji[buildResult] || "❓"} **Status:** **${buildResult}**
    ⏱️ **Duração:** \`${buildDuration}\`
    
    🔗 **Pipeline:**  
    ${buildUrl}
    
    ━━━━━━━━━━━━━━━━━━━━━━
    `;


    let color

    switch (buildResult) {
        case 'SUCCESS':
            color = 65280;
            break;
        case 'FAILURE':
            color = 16711680;
            break;
        case 'UNSTABLE':
            color = 16744192;
            break;
        case 'ABORTED':
            color = 8421504;
            break;
        default: 
            color = 16711680;
            break;
    }

    await webhook.send({
        username: "Jenkins",
        avatarURL: "https://i.imgur.com/l65Mo6m.png",
        files: [{
            attachment: './screenshot.png',
            name: 'screenshot.png'
        }],
        embeds: [{
            description: `${message}`,
            color,
            image:{ url:"attachment://screenshot.png"},
          }]
    });


    await browser.close();

    return;
}

captureScreenshotAndSend();




