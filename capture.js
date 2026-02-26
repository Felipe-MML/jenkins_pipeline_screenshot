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
const issueUrl      = process.argv[9];
const lighthouseUrl = process.argv[10]


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
    
    let colorHex;
    switch (buildResult) {
        case 'SUCCESS':
            colorHex = 0x2ECC71; // Verde vibrante
            break;
        case 'FAILURE':
            colorHex = 0xE74C3C; // Vermelho vibrante
            break;
        case 'UNSTABLE':
            colorHex = 0xF1C40F; // Amarelo
            break;
        case 'ABORTED':
            colorHex = 0x95A5A6; // Cinza
            break;
        default: 
            colorHex = 0xE74C3C;
            break;
    }

    const embed = {
        title: "🧪 RELATÓRIO DE TESTES – API",
        color: colorHex,
        fields: [
            {
                name: '🌿 Branch',
                value: `\`${branchBuild}\``,
                inline: true // O inline true coloca os itens lado a lado
            },
            {
                name: '🏗️ Build',
                value: `\`#${buildNumber}\``,
                inline: true
            },
            {
                name: 'Status',
                value: `${statusEmoji[buildResult] || "❓"} **${buildResult}**`,
                inline: true
            },
            {
                name: '⏱️ Duração',
                value: `\`${buildDuration.replace(' and counting', '')}\``,
                inline: true
            }
        ],
        
        description: `**Links Rápidos:**\n🔗 [Resultado dos Testes](${buildUrl})\n📊 [Relatório da build](${issueUrl})\n🚀 [Dashboard Lighthouse](${lighthouseUrl})`,
        image: { url: "attachment://screenshot.png" },
        footer: { text: "Jenkins Automated Pipeline" },
        timestamp: new Date().toISOString()
    };

    

    await webhook.send({
        username: "Jenkins",
        avatarURL: "https://i.imgur.com/l65Mo6m.png",
        files: [{
            attachment: './screenshot.png',
            name: 'screenshot.png'
        }],
        embeds: [embed]
    });


    await browser.close();

    return;
}

captureScreenshotAndSend();











