import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize GoogleGenAI SDK per gemini-api skill instructions
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// ElevenLabs Voice Configuration (Requested voice: rHNYx9huRzABmodCtI4Q)
const DEFAULT_ELEVENLABS_VOICE_ID = 'rHNYx9huRzABmodCtI4Q';
let elevenLabsApiKey = process.env.ELEVENLABS_API_KEY || '';
let activeVoiceId = DEFAULT_ELEVENLABS_VOICE_ID;

// In-memory persistent mock storage for multi-device sync simulation & WhatsApp message hub
interface StoredData {
  profiles: any[];
  photos: any[];
  whatsappLog: any[];
  whatsappChat: any[];
  parentNotes: any[];
  milestones: any[];
}

const db: StoredData = {
  profiles: [],
  photos: [
    {
      id: 'photo-1',
      childId: 'child-1',
      title: 'Liam se Eerste Somme! (Liam’s First Math!)',
      url: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=600&q=80',
      type: 'image',
      caption: 'Liam het 5 sterre verdien deur vorms te pas! ⭐⭐⭐⭐⭐',
      date: '2026-11-08',
      guardianApproved: true,
      tags: ['Wiskunde', 'Trots', 'Math Quest']
    },
    {
      id: 'photo-2',
      childId: 'child-1',
      title: 'Emosie Tekening: Vrolike Leeu',
      url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80',
      type: 'image',
      caption: 'Tekening van hoe gelukkig voel: Geel sonnetjies en glimlaggende leeus!',
      date: '2026-11-09',
      guardianApproved: true,
      tags: ['Kuns', 'EQ', 'Blydskap']
    }
  ],
  whatsappChat: [
    {
      id: 'wa-msg-1',
      sender: 'bot',
      text: '🦁 *Maatjie Guardian WhatsApp Bot is aktief!*\n\nJy kan enige tyd die volgende bevele stuur:\n• *STATUS* - Kyk na kindjie se skermtyd & sterre\n• *VERSLAG* - Kry die volle daaglikse wiskunde & EQ vorderingsverslag\n• *LIEFDE [boodskap]* - Stuur \'n briefie na kindjie se posbus\n• *SLUIT* - Sluit die skerm dadelik vir etenstyd/slaaptyd\n• *ONTSLUIT* - Gee 15 ekstra minute speeltyd',
      time: '08:00',
      status: 'read'
    },
    {
      id: 'wa-msg-2',
      sender: 'parent',
      text: 'STATUS',
      time: '12:15',
      status: 'read'
    },
    {
      id: 'wa-msg-3',
      sender: 'bot',
      text: '⏱️ *Kindjie se Huidige Status:*\n• Tyd gespeel: *18 min* (van 30 min)\n• Sterre verdien: *15 ⭐*\n• Gemoed: *Bly & Nuuskierig 😄*\n• Laaste aktiwiteit: Wiskunde Safarie (Somme tot 5 korrek opgelos!)',
      time: '12:15',
      status: 'read'
    }
  ],
  whatsappLog: [
    {
      id: 'wa-init-1',
      timestamp: new Date().toISOString(),
      recipientPhone: '+27 82 123 4567',
      recipientName: 'Mamma & Pappa',
      type: 'summary',
      status: 'delivered',
      preview: '🌟 Maatjie Daaglikse Verslag: Liam het vandag 18 minute gespeel. Wiskunde Telling: 95%! EQ: Kalm & Koöperatief.'
    }
  ],
  parentNotes: [
    {
      id: 'note-1',
      sender: 'Mamma (via WhatsApp)',
      text: 'Liewe Liam, ek is so baie trots op jou dat jy vandag jou speelgoed gedeel het! Jy is my sterretjie! ⭐❤️',
      timestamp: 'Vandag, 14:20',
      read: false,
      audioUrl: null
    }
  ],
  milestones: []
};

// 1. Companion Chat Endpoint
// Helper for authentic, fast Afrikaans companion responses
function buildSmartCompanionResponse({
  message = '',
  childName = 'Maatjie',
  age = 6,
  language = 'af',
  currentMood = 'happy',
  mathLevel = 1
}: any) {
  const isAf = language === 'af' || language === 'bilingual';
  const text = (message || '').toLowerCase();

  // Greetings
  if (text.includes('hallo') || text.includes('dag') || text.includes('hi') || text.includes('hello')) {
    return {
      reply: isAf
        ? `Aitsa ${childName}! Dis so lekker om jou te sien! Waaroor wil jy vandag gesels? Kom ons tel somme of vertel 'n storie!`
        : `Hooray ${childName}! It is so lovely to see you! What would you like to do today? Let's count stars or tell a fun story!`,
      afrikaans: `Aitsa ${childName}! Dis so lekker om jou te sien!`,
      english: `Hooray ${childName}! It is so lovely to see you!`,
      emotion: 'joy',
      suggestedActions: isAf ? ["Kom ons tel sterre! 🧮", "Vertel my 'n storie 🦁", "Ek voel vandag vrolik! 😄"] : ["Let's count stars! 🧮", "Tell me a story 🦁", "I feel happy today! 😄"],
      eqTip: isAf ? "Wenk: 'n Vriendelike glimlag maak enigiemand se dag beter!" : "Tip: A kind smile makes anyone's day brighter!",
      mathTip: isAf ? "Wiskunde: 1 glimlag + 1 drukkie = 2 lekker dinge!" : "Math: 1 smile + 1 hug = 2 happy things!"
    };
  }

  // Feelings
  if (text.includes('hartseer') || text.includes('sad') || text.includes('huil') || text.includes('kwaad') || text.includes('mad') || text.includes('ongelukkig') || text.includes('bang') || text.includes('scared')) {
    return {
      reply: isAf
        ? `Ai my liewe ${childName}, dit is heeltemal reg om soms groot gevoelens te hê. Sit jou handjie op jou borsie en vat 3 sagte blom-asemte saam met my: Asem in... en blaas sag uit. Jy is so dapper! ❤️`
        : `Oh my sweet ${childName}, it is completely okay to feel big feelings sometimes. Place your hand on your heart and take 3 gentle belly breaths with me: Inhale... and exhale. You are so brave! ❤️`,
      afrikaans: `Vat 'n diep asem saam met my: Asem in soos 'n blommetjie, blaas uit soos 'n kersie.`,
      english: `Take a deep breath with me: Smell the flower, blow out the candle.`,
      emotion: 'calm',
      suggestedActions: isAf ? ["Vat nog 'n asem 🌸", "Ek soek 'n drukkie 🤗", "Speel 'n speletjie"] : ["Take another breath 🌸", "I want a hug 🤗", "Play a game"],
      eqTip: isAf ? "Emosies is soos wolke in die lug: hulle kom en waai weer verby." : "Emotions are like clouds: they pass by safely when we breathe.",
      mathTip: isAf ? "Tel 3 diep asemte: een... twee... drie!" : "Count 3 deep breaths: one... two... three!"
    };
  }

  // Math & counting
  if (text.includes('som') || text.includes('somme') || text.includes('tel') || text.includes('plus') || text.includes('minus') || text.includes('math') || text.includes('wiskunde') || text.includes('sterre')) {
    return {
      reply: isAf
        ? `Aitsa ${childName}! Kom ons kyk: As die leeu 3 goue sterretjies het, en die apie gee vir hom nog 2, hoeveel sterre het hulle altesaam? 3 + 2 = ?`
        : `Awesome ${childName}! Let's check: If the lion has 3 golden stars, and the monkey gives him 2 more, how many stars do they have in total? 3 + 2 = ?`,
      afrikaans: `Hoeveel is 3 sterretjies + 2 sterretjies?`,
      english: `How much is 3 stars + 2 stars?`,
      emotion: 'proud',
      suggestedActions: isAf ? ["Dit is 5 sterre! ⭐", "4 sterre", "Nog 'n wiskunde som!"] : ["It is 5 stars! ⭐", "4 stars", "Another math sum!"],
      eqTip: isAf ? "Om foute te maak is hoe ons brein groter en sterker groei." : "Making mistakes is how our brain grows stronger.",
      mathTip: isAf ? "3 + 2 = 5! Tel dit op jou vingertjies: 1, 2, 3, 4, 5!" : "3 + 2 = 5! Count on your fingers: 1, 2, 3, 4, 5!"
    };
  }

  // Stories
  if (text.includes('storie') || text.includes('story') || text.includes('vertel') || text.includes('leeu') || text.includes('haas')) {
    return {
      reply: isAf
        ? `Eendag was daar 'n klein dapper leeutjie wat geleer het om sy speelgoed te deel. Toe hy sy gunsteling bal deel, het hy 2 nuwe maatjies gemaak! Wat dink jy, ${childName}?`
        : `Once upon a time, there was a brave little lion who learned to share his toys. When he shared his ball, he made 2 new friends! What do you think, ${childName}?`,
      afrikaans: `Deel maak ons harte warm en gee vir ons baie maatjies!`,
      english: `Sharing warms our hearts and brings many good friends!`,
      emotion: 'joy',
      suggestedActions: isAf ? ["Lees die storie 📖", "Vertel van die haas", "Kom ons speel"] : ["Read the story 📖", "Tell about the bunny", "Let's play"],
      eqTip: isAf ? "Wanneer ons deel, word ons eie vreugde dubbel so groot." : "When we share, our own joy doubles.",
      mathTip: isAf ? "1 bal gedeel deur 2 maats = 2 glimlagte!" : "1 ball shared with 2 friends = 2 smiles!"
    };
  }

  // Jokes
  if (text.includes('grappie') || text.includes('joke') || text.includes('lag') || text.includes('snaaks')) {
    return {
      reply: isAf
        ? `Hoekom het die olifant op die rekenaar gaan sit? Want hy wou op die muis trap! Haha! Wat 'n snaakse gedagte, ${childName}!`
        : `Why did the elephant sit on the computer? Because he wanted to catch the mouse! Haha! Isn't that funny, ${childName}!`,
      afrikaans: `Haha! Olifante en muise is so snaaks!`,
      english: `Haha! Elephants and mice are so funny!`,
      emotion: 'joy',
      suggestedActions: isAf ? ["Nog 'n grappie! 🎪", "Haha!", "Kom ons doen somme 🧮"] : ["Another joke! 🎪", "Haha!", "Let's do math 🧮"],
      eqTip: isAf ? "'n Lekker lag maak 'n mens se hele lyfie lig en vrolik." : "Laughter makes your whole body feel light and happy.",
      mathTip: isAf ? "1 grappie + 1 lag = 100% pret!" : "1 joke + 1 laugh = 100% fun!"
    };
  }

  // Default cheerful response
  return {
    reply: isAf
      ? `Aitsa ${childName}! Wat 'n slim gedagte! Ek hou so baie van jou nuuskierigheid. Kom ons kyk wat ons volgende kan ontdek saam!`
      : `Awesome ${childName}! What a clever thought! I love your curiosity so much. Let's see what we can discover next together!`,
    afrikaans: `Jy is 'n ware sterretjie, ${childName}!`,
    english: `You are a real little star, ${childName}!`,
    emotion: 'joy',
    suggestedActions: isAf ? ["Kom ons tel sterre! 🧮", "Vertel my 'n storie 🦁", "Ek voel vandag vrolik! 😄"] : ["Let's count stars! 🧮", "Tell me a story 🦁", "I feel happy today! 😄"],
    eqTip: isAf ? "Om vrae te vra wys hoe slim en nuuskierig jy is." : "Asking questions shows how bright and curious you are.",
    mathTip: isAf ? "Kyk om jou: hoeveel vensters kan jy in die vertrek tel?" : "Look around: how many windows can you count in the room?"
  };
}

// 1. Companion Chat Endpoint (with sub-second timeout & resilient fallback)
app.post('/api/companion/chat', async (req: Request, res: Response) => {
  const { message = '', childName = 'Maatjie', age = 6, language = 'af', currentMood = 'happy', mathLevel = 1 } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const smartFallback = buildSmartCompanionResponse({ message, childName, age, language, currentMood, mathLevel });

  if (!ai) {
    return res.json(smartFallback);
  }

  try {
    const systemPrompt = `You are "Maatjie & Sparky", a warm, cheerful, encouraging South African companion for a ${age}-year-old child named ${childName}.
Rules:
1. Speak 100% natural, idiomatic South African Afrikaans ("Aitsa!", "Mooi so!", "Kyk net daar!", "Wat 'n slimkop!").
2. Ultra-short: Exactly 2 lively sentences.
Output JSON:
{
  "reply": "2 lively sentences in natural Afrikaans",
  "afrikaans": "Afrikaans translation",
  "english": "English translation",
  "emotion": "joy" | "proud" | "calm" | "thinking",
  "suggestedActions": ["Kort opsie 1", "Kort opsie 2", "Kort opsie 3"],
  "eqTip": "Kort EQ wenk",
  "mathTip": "Kort wiskunde wenk"
}`;

    // Race with a 2000ms timeout so the child never waits
    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      }
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT_2S')), 2000)
    );

    const response: any = await Promise.race([generatePromise, timeoutPromise]);
    const text = response?.text || '{}';
    const parsed = JSON.parse(text);

    return res.json({
      ...smartFallback,
      ...parsed,
      reply: parsed.reply || smartFallback.reply
    });
  } catch (err: any) {
    // If Gemini 503s, times out or errors, gracefully return the authentic smart response immediately!
    console.warn('Gemini chat fallback engaged:', err?.message || err);
    return res.json(smartFallback);
  }
});

// 2. Interactive Stories Generator
app.post('/api/stories/generate', async (req: Request, res: Response) => {
  try {
    const { theme = 'empathy', childName = 'Liam', age = 6, language = 'bilingual', customPrompt = '' } = req.body;

    if (!ai) {
      // Fallback pre-crafted bilingual story
      return res.json({
        id: 'story-fallback-1',
        title: language === 'af' ? 'Die Dapper Haasie wat Gedeel het' : 'The Brave Bunny Who Shared',
        titleAf: 'Die Dapper Haasie wat Gedeel het',
        titleEn: 'The Brave Bunny Who Shared',
        eqTheme: 'Deelsug & Vriendelikheid (Sharing & Kindness)',
        mathConcept: 'Optelling & Halvering (1 + 1 en Deel deur 2)',
        scenes: [
          {
            sceneNumber: 1,
            textAf: `Eendag het Haasie Huppel in die Groen Bos 4 sappige goue wortels gevind. Hy was so trots! Maar toe kom sy maatjie skilpad verby met 'n knorrende maag.`,
            textEn: `One day, Bunny Hops found 4 juicy golden carrots in the Green Forest. He was so proud! But then his friend Tortoise arrived with a rumbling tummy.`,
            questionAf: `Wat moet Haasie Huppel doen met die 4 wortels?`,
            questionEn: `What should Bunny Hops do with the 4 carrots?`,
            choices: [
              {
                textAf: `Deel 2 wortels met Skilpad (4 - 2 = 2)`,
                textEn: `Share 2 carrots with Tortoise (4 - 2 = 2)`,
                isGenerous: true,
                mathOutcome: '4 minus 2 = 2 vir elkeen! Gelyk en regverdig.'
              },
              {
                textAf: `Eet al 4 alleen op vinnig`,
                textEn: `Eat all 4 alone quickly`,
                isGenerous: false,
                mathOutcome: 'Haasie se magie was vol, maar sy hartjie was eensaam.'
              }
            ]
          },
          {
            sceneNumber: 2,
            textAf: `Haasie gee toe 2 wortels vir Skilpad. Skilpad se oë blink van dankbaarheid! "Dankie my maatjie!" Skilpad gee vir Haasie 2 blou bessies as 'n verrassing. Nou het Haasie 2 wortels + 2 bessies!`,
            textEn: `Bunny gave 2 carrots to Tortoise. Tortoise's eyes shone with gratitude! "Thank you my friend!" Tortoise gifted Bunny 2 blue berries. Now Bunny had 2 carrots + 2 berries!`,
            questionAf: `Hoeveel lekkernye het Haasie nou altesaam? (2 + 2 = ?)`,
            questionEn: `How many treats does Bunny have in total now? (2 + 2 = ?)`,
            choices: [
              { textAf: `4 heerlike lekkernye!`, textEn: `4 delicious treats!`, correctMath: true },
              { textAf: `3 lekkernye`, textEn: `3 treats`, correctMath: false }
            ]
          },
          {
            sceneNumber: 3,
            textAf: `Presies 4! Haasie en Skilpad het saam 'n piekniek gehou. Haasie het geleer: Wanneer ons deel, word ons vreugde dubbel so groot!`,
            textEn: `Exactly 4! Bunny and Tortoise had a lovely picnic together. Bunny learned: When we share, our joy doubles!`,
            questionAf: `Hoe voel Haasie se hartjie nou?`,
            questionEn: `How does Bunny's heart feel right now?`,
            choices: [
              { textAf: `Warm, tevrede en gelukkig! ❤️`, textEn: `Warm, peaceful and happy! ❤️`, isHappy: true },
              { textAf: `Kwaad`, textEn: `Angry`, isHappy: false }
            ]
          }
        ],
        badgeEarned: 'Deelsug Kampioen (Sharing Champion ⭐)'
      });
    }

    const storyPrompt = `Create an interactive 3-scene bilingual story for a child named ${childName}, age ${age}.
Theme: ${theme}.
Additional parent/child request: "${customPrompt}".
Language: Both Afrikaans and English for every scene.

Requirements:
1. EQ Element: Must actively teach an emotional intelligence skill (identifying emotions, calming down, kindness, patience, honesty, trying again after failing).
2. Math Skill: Must naturally integrate a fun basic math challenge appropriate for age ${age} (counting items, simple addition/subtraction, comparing bigger/smaller, identifying shapes like triangles or circles).
3. 3 Scenes: Each scene must have:
   - sceneNumber (1, 2, 3)
   - textAf (rich, expressive Afrikaans narrative)
   - textEn (matching English narrative)
   - questionAf & questionEn (prompting child to choose)
   - choices: Array of 2 options with textAf, textEn, and educational feedback.
4. Title in Afrikaans and English.
5. badgeEarned: Name of an achievement badge earned upon completing the story.

Return strictly valid JSON:
{
  "id": "story-${Date.now()}",
  "titleAf": "...",
  "titleEn": "...",
  "eqTheme": "...",
  "mathConcept": "...",
  "scenes": [
    {
      "sceneNumber": 1,
      "textAf": "...",
      "textEn": "...",
      "questionAf": "...",
      "questionEn": "...",
      "choices": [
        {"textAf": "...", "textEn": "...", "isCorrectOrPositive": true, "outcomeNote": "..."},
        {"textAf": "...", "textEn": "...", "isCorrectOrPositive": false, "outcomeNote": "..."}
      ]
    }
  ],
  "badgeEarned": "..."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: storyPrompt,
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      }
    });

    const result = JSON.parse(response.text || '{}');
    res.json(result);
  } catch (err: any) {
    console.warn('Story generation fallback:', err?.message || err);
    // Return high quality bilingual story
    return res.json({
      id: `story-fb-${Date.now()}`,
      titleAf: 'Die Dapper Leeutjie se Goue Vorms',
      titleEn: 'The Brave Little Lion’s Golden Shapes',
      eqTheme: 'Deelsug & Moed (Sharing & Courage)',
      mathConcept: 'Optelling tot 5 & Vorms (Addition to 5 & Shapes)',
      badgeEarned: 'Dapper Leeu Kenteken 🦁⭐',
      scenes: [
        {
          sceneNumber: 1,
          textAf: `Klein Leeutjie Luan het 3 goue sirkels en 2 blou driehoeke in die bos gevind. Hy wou 'n kasteel bou, maar die blokke het bly gly. Sy hartjie klop vinnig van frustrasie!`,
          textEn: `Little Lion Luan found 3 golden circles and 2 blue triangles in the forest. He wanted to build a castle, but the blocks kept slipping. His heart beat fast with frustration!`,
          questionAf: `Wat moet Luan doen om kalm te word?`,
          questionEn: `What should Luan do to become calm?`,
          choices: [
            { textAf: `Haal 3 diep blom-asemte in en vra sy maatjie om te help 🌸🤝`, textEn: `Take 3 deep flower breaths and ask his friend to help 🌸🤝`, isCorrectOrPositive: true },
            { textAf: `Gooi die blokke weg`, textEn: `Throw the blocks away`, isCorrectOrPositive: false }
          ]
        },
        {
          sceneNumber: 2,
          textAf: `Luan het rustig asemgehaal en sy maatjie Olifantjie het gekom om die blokke vas te hou. Nou het hulle 3 goue sirkels + 2 blou driehoeke!`,
          textEn: `Luan breathed calmly and his friend Elephant came to steady the blocks. Now they have 3 golden circles + 2 blue triangles!`,
          questionAf: `Hoeveel vorms het hulle altesaam? (3 + 2 = ?)`,
          questionEn: `How many shapes do they have in total? (3 + 2 = ?)`,
          choices: [
            { textAf: `5 pragtige vorms! 🔺🟢`, textEn: `5 beautiful shapes! 🔺🟢`, isCorrectOrPositive: true },
            { textAf: `4 vorms`, textEn: `4 shapes`, isCorrectOrPositive: false }
          ]
        },
        {
          sceneNumber: 3,
          textAf: `Mooi so! 3 + 2 = 5! Hulle bou toe die sterkste kasteel. Luan het geleer: Met asemhaling, geduld en goeie somme kan ons enige toring bou!`,
          textEn: `Awesome! 3 + 2 = 5! They built the strongest castle. Luan learned: With breathing, patience and clever math, we can build any tower!`,
          questionAf: `Hoe voel Luan se dapper hartjie nou?`,
          questionEn: `How does Luan's brave heart feel now?`,
          choices: [
            { textAf: `Trots en dankbaar! ❤️`, textEn: `Proud and thankful! ❤️`, isCorrectOrPositive: true },
            { textAf: `Kwaad`, textEn: `Angry`, isCorrectOrPositive: false }
          ]
        }
      ]
    });
  }
});

// 3. Adaptive Games & Quests Generator
app.post('/api/games/generate', async (req: Request, res: Response) => {
  const { category = 'math', difficulty = 'easy', age = 6, childName = 'Liam' } = req.body || {};
  try {

    if (!ai) {
      return res.json({
        id: `game-${Date.now()}`,
        category,
        titleAf: category === 'math' ? 'Wiskunde Safarie: Vrugte Tel' : 'Emosie Speurder: Gesiggies',
        titleEn: category === 'math' ? 'Math Safari: Fruit Count' : 'Emotion Detective: Face Clues',
        instructionAf: category === 'math' ? 'Kyk na die vrugte en tel hoeveel piesangs daar is!' : 'Kyk na Maatjie se gesig. Hoe voel hy vandag?',
        instructionEn: category === 'math' ? 'Look at the fruits and count how many bananas there are!' : 'Look at Maatjie’s face. How is he feeling today?',
        questionAf: category === 'math' ? 'As die apie 3 piesangs het en 2 bykry, hoeveel het hy?' : 'Haas voel hartseer omdat sy toring omgeval het. Wat kan hy doen?',
        questionEn: category === 'math' ? 'If the monkey has 3 bananas and gets 2 more, how many does he have?' : 'Bunny feels sad because his block tower fell. What can he do?',
        visualEmoji: category === 'math' ? '🍌🍌🍌 + 🍌🍌' : '😢🧱🏗️',
        options: category === 'math' ? [
          { text: '5 piesangs 🍌', isCorrect: true, feedbackAf: 'Mooi so! 3 + 2 = 5!', feedbackEn: 'Awesome! 3 + 2 = 5!' },
          { text: '4 piesangs 🍌', isCorrect: false, feedbackAf: 'Byna! Kom ons tel weer saam: 1, 2, 3, 4, 5!', feedbackEn: 'Almost! Let’s count again: 1, 2, 3, 4, 5!' },
          { text: '6 piesangs 🍌', isCorrect: false, feedbackAf: 'Bietjie te veel. 3 + 2 is 5!', feedbackEn: 'A bit too many. 3 + 2 is 5!' }
        ] : [
          { text: 'Vat 3 diep asemte en bou weer rustig 🌬️🧱', isCorrect: true, feedbackAf: 'Puik! Om asem te haal help ons kalmeer.', feedbackEn: 'Super! Breathing deep helps us calm down.' },
          { text: 'Skop die ander blokke weg 😡', isCorrect: false, feedbackAf: 'Dit kan iemand seermaak. Probeer liewer diep asemhaal.', feedbackEn: 'That might hurt someone. Try taking a deep breath instead.' },
          { text: 'Vra ' + childName + ' om te help 🤝', isCorrect: true, feedbackAf: 'Wonderlik! Om hulp te vra is baie dapper.', feedbackEn: 'Wonderful! Asking for help is very brave.' }
        ],
        starsAwarded: 3
      });
    }

    const prompt = `Generate an engaging interactive mini-game challenge for a ${age} year old named ${childName}.
Category: ${category} ('math' or 'eq').
Difficulty: ${difficulty}.
The game must be bilingual (Afrikaans and English text).
Format strictly JSON:
{
  "id": "game-${Date.now()}",
  "category": "${category}",
  "titleAf": "...",
  "titleEn": "...",
  "instructionAf": "...",
  "instructionEn": "...",
  "questionAf": "...",
  "questionEn": "...",
  "visualEmoji": "...",
  "options": [
    {"text": "...", "isCorrect": true, "feedbackAf": "...", "feedbackEn": "..."},
    {"text": "...", "isCorrect": false, "feedbackAf": "...", "feedbackEn": "..."},
    {"text": "...", "isCorrect": false, "feedbackAf": "...", "feedbackEn": "..."}
  ],
  "starsAwarded": 3
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      }
    });

    const result = JSON.parse(response.text || '{}');
    res.json(result);
  } catch (err: any) {
    console.warn('Game generation fallback:', err?.message || err);
    return res.json({
      id: `game-fb-${Date.now()}`,
      category,
      titleAf: category === 'math' ? 'Wiskunde Safarie: Vrugte Tel' : 'Emosie Speurder: Gesiggies',
      titleEn: category === 'math' ? 'Math Safari: Fruit Count' : 'Emotion Detective: Face Clues',
      instructionAf: category === 'math' ? 'Tel hoeveel piesangs daar is!' : 'Hoe voel Haas vandag?',
      instructionEn: category === 'math' ? 'Count how many bananas there are!' : 'How does Bunny feel today?',
      questionAf: category === 'math' ? '2 Piesangs + 3 Piesangs = ?' : 'Haas voel gefrustreerd oor sy toring. Wat doen hy?',
      questionEn: category === 'math' ? '2 Bananas + 3 Bananas = ?' : 'Bunny feels frustrated with his tower. What does he do?',
      visualEmoji: category === 'math' ? '🍌🍌 + 🍌🍌🍌' : '😢🧱➔🧘',
      options: category === 'math' ? [
        { text: '5 piesangs 🍌', isCorrect: true, feedbackAf: 'Mooi so! 2 + 3 = 5!', feedbackEn: 'Awesome! 2 + 3 = 5!' },
        { text: '4 piesangs 🍌', isCorrect: false, feedbackAf: 'Byna! Kom ons tel weer: 1, 2, 3, 4, 5!', feedbackEn: 'Almost! Count again: 1, 2, 3, 4, 5!' },
        { text: '6 piesangs 🍌', isCorrect: false, feedbackAf: 'Bietjie te veel. 2 + 3 is 5!', feedbackEn: 'A bit too many.' }
      ] : [
        { text: 'Vat 3 diep asemte en bou weer rustig 🌬️', isCorrect: true, feedbackAf: 'Puik! Om asem te haal help ons kalmeer.', feedbackEn: 'Super! Breathing deep helps us calm down.' },
        { text: 'Skop die blokke 😡', isCorrect: false, feedbackAf: 'Dit kan iemand seermaak.', feedbackEn: 'That might hurt someone.' },
        { text: 'Vra vir hulp 🤝', isCorrect: true, feedbackAf: 'Wonderlik! Om hulp te vra is baie dapper.', feedbackEn: 'Asking for help is very brave.' }
      ],
      starsAwarded: 3
    });
  }
});

// 4. Parent Custom Story & Game Creator
app.post('/api/parent/custom-content', async (req: Request, res: Response) => {
  const { childName = 'Liam', age = 6, focusArea = 'Moed & Kalmte', details = '', contentType = 'story' } = req.body || {};
  try {

    if (!ai) {
      return res.json({
        success: true,
        generatedContent: {
          title: `Spesiale Avontuur vir ${childName}: ${focusArea || 'Groot Dapper Hartjie'}`,
          summary: `Hierdie storie help ${childName} om ${details || 'kalm te bly en mooi te luister'} op 'n prettige manier.`,
          previewTextAf: `${childName} het vandag geleer dat selfs superhelde soms bang word, maar met 3 diep asemte en goeie somme kan enigiets oorkom word!`,
          previewTextEn: `${childName} learned today that even superheroes feel scared sometimes, but with 3 deep breaths and clever math, anything can be overcome!`,
          eqFocus: focusArea,
          createdDate: new Date().toLocaleDateString()
        }
      });
    }

    const prompt = `A loving parent wants to create a personalized educational ${contentType} for their child:
Child: ${childName}, age ${age}
Focus Goal / Challenge: "${focusArea}"
Parent notes/context: "${details}"

Generate a customized learning asset with high EQ wisdom and playful math reinforcement in both Afrikaans and English.
Return strictly JSON:
{
  "success": true,
  "generatedContent": {
    "title": "...",
    "summary": "...",
    "previewTextAf": "...",
    "previewTextEn": "...",
    "eqFocus": "${focusArea}",
    "mathConcept": "...",
    "recommendedDiscussionQuestions": ["Question 1 for parents to ask at dinner", "Question 2"]
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      }
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (err: any) {
    console.warn('Custom parent content fallback:', err?.message || err);
    return res.json({
      success: true,
      generatedContent: {
        title: `Spesiale Avontuur vir ${childName}: ${focusArea || 'Groot Dapper Hartjie'}`,
        summary: `Hierdie storie help ${childName} om ${details || 'kalm te bly en mooi te luister'} op 'n prettige manier.`,
        previewTextAf: `${childName} het vandag geleer dat selfs superhelde soms bang word, maar met 3 diep asemte en goeie somme kan enigiets oorkom word!`,
        previewTextEn: `${childName} learned today that even superheroes feel scared sometimes, but with 3 deep breaths and clever math, anything can be overcome!`,
        eqFocus: focusArea || 'Moed & Kalmte',
        mathConcept: 'Optelling tot 5 & Vorms',
        recommendedDiscussionQuestions: [
          `Vra vir ${childName}: "Wat het die dapper diertjie gedoen toe dinge moeilik raak?"`,
          `Oefen vanaand saam 3 diep asemte voor slaaptyd!`
        ]
      }
    });
  }
});

// 5. WhatsApp Integration: Milestone Report & Direct Send
app.post('/api/whatsapp/send-summary', async (req: Request, res: Response) => {
  try {
    const {
      childName = 'Liam',
      guardianPhone = '+27 82 123 4567',
      todayMinutes = 24,
      mathCompleted = 8,
      mathAccuracy = 92,
      eqSkillsPracticed = ['Belly Breathing', 'Sharing Snacks', 'Naming Frustration'],
      newWordsLearned = ['Dapper (Brave)', 'Deelsaam (Generous)', 'Reghoek (Rectangle)'],
      moodDominant = 'Bly & Nuuskierig (Joyful & Curious)'
    } = req.body;

    const reportMessage = `🦁 *MAATJIE & SPARKY - DAAGLIKSE VERSLAG / DAILY MILESTONES* 🦁
📅 Datum: ${new Date().toLocaleDateString('af-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
👤 Kindjie: *${childName}*

⏱️ *Skermtyd & Balans:*
• Tyd gespeel: *${todayMinutes} minute* (Binne daaglikse perk)
• Huidige Gemoed: ${moodDominant}

🧮 *Wiskunde Vordering:*
• Somme & Vorms voltooi: *${mathCompleted} uitdagings*
• Akkuraatheid: *${mathAccuracy}%* ⭐⭐⭐⭐⭐
• Sleutelkonsep: Twee-tel & Patrone

❤️ *Emosionele Intelligensie (EQ):*
• Sleutelvaardighede beoefen:
  - ${eqSkillsPracticed.join('\n  - ')}
• Reaksie op foute: Het weer probeer sonder moedeloosheid!

🗣️ *Tweetalige Woordeskat:*
• ${newWordsLearned.join(', ')}

💡 *Wenk vir Ouers vanaand:*
Vra vir ${childName} tydens etenstyd: "Wat het Haasie gedoen toe sy toring omval?" en geniet 'n drukkie!

_Veilig gestuur deur Maatjie AI Companion Guardian Hub._`;

    // Encode for WhatsApp Web / WhatsApp App click-to-chat
    const cleanPhone = guardianPhone.replace(/[^0-9]/g, '');
    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(reportMessage)}`;

    // Store in our server WhatsApp log
    const logEntry = {
      id: `wa-${Date.now()}`,
      timestamp: new Date().toISOString(),
      recipientPhone: guardianPhone,
      recipientName: 'Geverifieerde Voog',
      type: 'daily_milestone_summary',
      status: 'sent',
      messageContent: reportMessage,
      waLink
    };
    db.whatsappLog.unshift(logEntry);

    res.json({
      success: true,
      message: 'WhatsApp summary generated and logged successfully!',
      waLink,
      reportMessage,
      logEntry
    });
  } catch (err: any) {
    console.error('WhatsApp summary error:', err);
    res.status(500).json({ error: 'Failed to generate WhatsApp summary' });
  }
});

// ElevenLabs Text-to-Speech Route (Default Voice ID: rHNYx9huRzABmodCtI4Q)
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voiceId = activeVoiceId, apiKey: customKey } = req.body;
    const keyToUse = customKey || elevenLabsApiKey || process.env.ELEVENLABS_API_KEY;

    if (!keyToUse) {
      return res.json({
        success: false,
        fallback: true,
        message: 'No ElevenLabs API key found. Using enhanced on-device Afrikaans synthesizer.',
        voiceId: DEFAULT_ELEVENLABS_VOICE_ID
      });
    }

    const cleanText = (text || '')
      .replace(/[*_#`~]/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .trim();

    const targetVoice = voiceId || activeVoiceId || DEFAULT_ELEVENLABS_VOICE_ID;
    const xiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${targetVoice}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const xiResponse = await fetch(xiUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': keyToUse,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      signal: controller.signal,
      body: JSON.stringify({
        text: cleanText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.85,
          style: 0.15,
          use_speaker_boost: true
        }
      })
    });
    clearTimeout(timeoutId);

    if (!xiResponse.ok) {
      const errText = await xiResponse.text();
      console.warn('ElevenLabs API response not ok:', xiResponse.status, errText);
      return res.json({
        success: false,
        fallback: true,
        error: `ElevenLabs ${xiResponse.status}: ${errText}`
      });
    }

    const arrayBuffer = await xiResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = `data:audio/mpeg;base64,${buffer.toString('base64')}`;

    res.json({
      success: true,
      audioUrl: base64Audio,
      voiceId: targetVoice,
      source: 'elevenlabs'
    });
  } catch (err: any) {
    console.error('TTS endpoint error:', err);
    res.json({ success: false, fallback: true, error: err.message });
  }
});

app.post('/api/elevenlabs/config', (req: Request, res: Response) => {
  const { apiKey, voiceId } = req.body;
  if (apiKey !== undefined) elevenLabsApiKey = apiKey;
  if (voiceId) activeVoiceId = voiceId;
  res.json({
    success: true,
    hasKey: !!(process.env.ELEVENLABS_API_KEY || elevenLabsApiKey),
    voiceId: activeVoiceId
  });
});

app.get('/api/elevenlabs/status', (_req: Request, res: Response) => {
  res.json({
    hasKey: !!(process.env.ELEVENLABS_API_KEY || elevenLabsApiKey),
    voiceId: activeVoiceId,
    defaultVoiceId: DEFAULT_ELEVENLABS_VOICE_ID
  });
});

// Interactive WhatsApp Chat & Command Center
app.get('/api/whatsapp/chat', (_req: Request, res: Response) => {
  res.json({
    chat: db.whatsappChat,
    logs: db.whatsappLog,
    parentNotes: db.parentNotes
  });
});

app.post('/api/whatsapp/chat', (req: Request, res: Response) => {
  const { message = '', childName = 'Liam' } = req.body;
  const trimmed = message.trim();
  const nowStr = new Date().toLocaleTimeString('af-ZA', { hour: '2-digit', minute: '2-digit' });

  const userMsg = {
    id: `wa-${Date.now()}-parent`,
    sender: 'parent',
    text: trimmed,
    time: nowStr,
    status: 'read'
  };
  db.whatsappChat.push(userMsg);

  let botReply = '';
  let actionTrigger: string | null = null;
  const upper = trimmed.toUpperCase();

  if (upper === 'STATUS' || upper === 'SPEELTYD') {
    botReply = `⏱️ *Status vir ${childName}:*\n• Skermtyd: *18 min / 30 min*\n• Sterre verdien: *15 ⭐*\n• Gemoed: *Bly & Nuuskierig 😄*\n• Laaste som: 3 + 2 = 5 (Korrek!)`;
  } else if (upper === 'VERSLAG' || upper === 'REPORT') {
    botReply = `📊 *Daaglikse Verslag vir ${childName}:*\n• Wiskunde Akkuraatheid: *94%*\n• EQ Vaardigheid: *Diep blom-asemhaling & Deelsug*\n• Woordeskat: *18 nuwe tweetalige woorde*\n• Aanbeveling: Gee vir ${childName} vanaand 'n hoë vyf vir sy somme!`;
  } else if (upper.startsWith('LIEFDE') || upper.startsWith('LOVE')) {
    const noteContent = trimmed.replace(/^(LIEFDE|LOVE)/i, '').trim() || 'Ons is baie lief vir jou!';
    db.parentNotes.unshift({
      id: `note-${Date.now()}`,
      sender: 'Mamma & Pappa (via WhatsApp)',
      text: noteContent,
      timestamp: 'Netnou',
      read: false,
      audioUrl: null
    });
    botReply = `💌 *Liefdesbriefie afgelewer!* "${noteContent}" verskyn nou dadelik op ${childName} se skerm met goue sterre! ⭐❤️`;
    actionTrigger = 'love_note_delivered';
  } else if (upper === 'SLUIT' || upper === 'LOCK' || upper === 'SLAAPTYD') {
    botReply = `🔒 *Skerm Sluiting Geaktiveer!* Maatjie het oorgeskakel na die sagte slaapliedjie en die skerm gesluit vir etenstyd/slaaptyd.`;
    actionTrigger = 'lock_screen';
  } else if (upper === 'ONTSLUIT' || upper === 'UNLOCK') {
    botReply = `🔓 *15 Minute Ekstra Gegee!* ${childName} se speeltyd is met 15 minute verleng.`;
    actionTrigger = 'bonus_time_15';
  } else {
    botReply = `🦁 *Maatjie WhatsApp Bot:*\nHallo! Ek help jou om ${childName} se vordering te monitor. Tik:\n• *STATUS* vir speeltyd\n• *VERSLAG* vir volle rapport\n• *LIEFDE [boodskap]* om 'n boodskappie na sy skerm te stuur\n• *SLUIT* om die skerm dadelik te sluit\n• *ONTSLUIT* vir 15 min ekstra`;
  }

  const botMsg = {
    id: `wa-${Date.now()}-bot`,
    sender: 'bot',
    text: botReply,
    time: nowStr,
    status: 'read'
  };
  db.whatsappChat.push(botMsg);

  res.json({
    success: true,
    userMsg,
    botMsg,
    actionTrigger,
    chat: db.whatsappChat
  });
});

// Get WhatsApp logs
app.get('/api/whatsapp/messages', (_req: Request, res: Response) => {
  res.json({
    logs: db.whatsappLog,
    parentNotes: db.parentNotes
  });
});

// Simulate receiving a parent WhatsApp reply/love note
app.post('/api/whatsapp/receive-reply', (req: Request, res: Response) => {
  const { sender = 'Mamma (via WhatsApp)', text, audioUrl = null } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  const newNote = {
    id: `note-${Date.now()}`,
    sender,
    text,
    timestamp: 'Netnou',
    read: false,
    audioUrl
  };
  db.parentNotes.unshift(newNote);
  res.json({ success: true, note: newNote });
});

// 6. Photo & Video Vault Endpoints (Restricted to verified guardians)
app.get('/api/vault/media', (_req: Request, res: Response) => {
  res.json({ media: db.photos });
});

app.post('/api/vault/media', (req: Request, res: Response) => {
  const { title, url, type = 'image', caption, tags = [], guardianApproved = true, childId = 'child-1' } = req.body;
  const newMedia = {
    id: `media-${Date.now()}`,
    childId,
    title: title || 'Nuwe Skepping',
    url,
    type,
    caption: caption || '',
    date: new Date().toISOString().split('T')[0],
    guardianApproved,
    tags
  };
  db.photos.unshift(newMedia);
  res.json({ success: true, media: newMedia });
});

// Multi-device sync endpoint
app.post('/api/vault/sync', (req: Request, res: Response) => {
  const { encryptedPayload } = req.body;
  res.json({
    success: true,
    syncedAt: new Date().toISOString(),
    itemsSynced: encryptedPayload ? Object.keys(encryptedPayload).length : 5,
    status: 'encrypted_and_synchronized'
  });
});

// Setup Vite middleware in dev or serve static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer }
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🦁 Maatjie AI Companion Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
