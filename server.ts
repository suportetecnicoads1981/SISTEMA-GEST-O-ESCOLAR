import express from 'express';
import path from 'path';
import os from 'os';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to get local network IP addresses
function getLocalNetworkAddresses(): { name: string; address: string; family: string }[] {
  const interfaces = os.networkInterfaces();
  const addresses: { name: string; address: string; family: string }[] = [];
  
  for (const name of Object.keys(interfaces)) {
    const ifaceList = interfaces[name];
    if (ifaceList) {
      for (const iface of ifaceList) {
        // Skip internal/loopback unless needed
        if (!iface.internal && iface.family === 'IPv4') {
          addresses.push({ name, address: iface.address, family: iface.family });
        }
      }
    }
  }
  return addresses;
}

// API Health Check & Discovery
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'EduGestão Pro Server',
    version: '4.2.0-Enterprise',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    hostname: os.hostname(),
    platform: os.platform(),
    networkAddresses: getLocalNetworkAddresses(),
  });
});

// API Network Server Info
app.get('/api/server-info', (req, res) => {
  const localIps = getLocalNetworkAddresses();
  res.json({
    serverName: `EduGestão-Server-${os.hostname()}`,
    hostname: os.hostname(),
    osType: os.type(),
    osRelease: os.release(),
    totalMemoryMb: Math.round(os.totalmem() / (1024 * 1024)),
    freeMemoryMb: Math.round(os.freemem() / (1024 * 1024)),
    ipList: localIps.map((i) => i.address),
    port: PORT,
    suggestedUrls: [
      `http://localhost:${PORT}`,
      ...localIps.map((i) => `http://${i.address}:${PORT}`),
    ],
    status: 'ONLINE',
  });
});

// Ping endpoint for Client/Server installer connection test
app.get('/api/ping', (req, res) => {
  res.json({
    pong: true,
    serverTime: new Date().toISOString(),
    protocol: 'EduGestao-RPC-v4',
  });
});

// AI Pedagogical Insights Synthesis (optional Gemini enhancement)
app.post('/api/ai/pedagogical-insights', async (req, res) => {
  try {
    const { examTitle, subject, className, averageScore, commonErrors, topicMastery } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback deterministic response
      return res.json({
        success: true,
        source: 'RULE_ENGINE',
        recommendations: [
          `Reforço prioritário para a turma ${className} na disciplina de ${subject}.`,
          `Focar nas habilidades BNCC com maior taxa de erro identificadas na avaliação "${examTitle}".`,
          `Recomenda-se metodologia ativa com resolução dialogada dos distratores mais assinalados.`,
        ],
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Você é um especialista em coordenação pedagógica e psicometria educacional.
Analise os seguintes resultados da avaliação escolar:
- Prova: "${examTitle}" (${subject})
- Turma: ${className}
- Média da Turma: ${averageScore}
- Erros mais comuns e distratores: ${JSON.stringify(commonErrors?.slice(0, 3))}
- Domínio por Tópicos: ${JSON.stringify(topicMastery)}

Gere 3 recomendações pedagógicas de intervenção e um plano de ação sucinto em tópicos para os professores. Responda em Português do Brasil com foco em recuperação da aprendizagem.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({
      success: true,
      source: 'GEMINI_AI',
      text: response.text,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao processar insights pedagógicos';
    res.status(500).json({ success: false, error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EduGestão Pro] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
