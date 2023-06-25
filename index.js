// * To downlod the youtube video from the URL
const fs = require("fs");
const ytdl = require("ytdl-core");
const axios = require("axios");
const execSync = require("child_process").execSync;

// *! To fetch answers from OPEN AI
const { Configuration, OpenAIApi } = require("openai");
const dotenv = require("dotenv");
dotenv.config();

class OpenAI {
  constructor(apiKey) {
    // Create the Configuration and OpenAIApi instances
    this.openai = new OpenAIApi(new Configuration({ apiKey }));
  }

  // Asynchronous function to generate text from the OpenAI API
  async generateText(prompt, model, max_tokens, temperature = 0.85) {
    try {
      // Send a request to the OpenAI API to generate text
      const response = await this.openai.createCompletion({
        model,
        prompt,
        max_tokens,
        n: 1,
        temperature,
      });

      console.log(`request cost: ${response.data.usage.total_tokens} tokens`);
      // Return the text of the response
      return response.data.choices[0].text;
    } catch (error) {
      throw error;
    }
  }
}

// *! Open Ai
const OPENAPI_KEY = process.env.OPEN_API_KEY;

const openAI = new OpenAI(OPENAPI_KEY);
const topic = "NodeJs";
const model = "text-davinci-003";

// *!whatsbot
const makeWASocket = require("@whiskeysockets/baileys").default;

const {
  DisconnectReason,
  useMultiFileAuthState,
  MessageType,
} = require("@whiskeysockets/baileys");

const store = {};
const getMessage = (key) => {
  const { id } = key;
  if (store[id]) return store[id].message;
};

async function WABot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
    getMessage,
  });
  const getText = (message) => {
    try {
      return message.conversation || message.extendedTextMessage.text;
    } catch {
      return "";
    }
  };
  const sendMessage = async (jid, content) => {
    try {
      const sent = await sock.sendMessage(jid, content);
      store[sent.key.id] = sent;
    } catch (err) {
      console.error("Error sending message: ", err);
    }
  };
  const handleYTDownload = async (msg) => {
    const { key, message } = msg;
    const text = getText(message);
    if (!text.toLowerCase().startsWith("@ytd")) return;
    const videoURL = text.slice(4);
    const downloadStream = ytdl(videoURL, { quality: 18 });
    downloadStream
      .pipe(fs.createWriteStream("downloads/video.m4v"))
      .on("finish", () => {
        // File download completed
        console.log("Video downloaded successfully");
        // Read the downloaded video file
        const videoBuffer = fs.readFileSync("downloads/video.m4v");

        // Send the message
        sendMessage(key.remoteJid, {
          video: videoBuffer,
          caption: "Unveiling your cinematic creation, now.",
          mimetype: "video/mp4", // Set the mimetype to specify the video format
        });
      });
  };

  const handleIG = async (msg) => {
    const { key, message } = msg;
    const text = getText(message);
    if (!text.toLowerCase().startsWith("@igd")) return;
    const url = text.slice(4);
    callPythonFunction(url);
    const savePath = "downloads/ig.mp4";
    // Read the downloaded video file
    const videoBuffer = fs.readFileSync(savePath);
    sendMessage(
      key.remoteJid,
      {
        video: videoBuffer,
        caption: "Video Generated!",
        mimetype: "video/mp4", // Set the mimetype to specify the video format
      },
      { quoted: msg }
    );
  };

  const handleAi = async (msg) => {
    const { key, message } = msg;
    const text = getText(message);
    if (!text.toLowerCase().startsWith("@ask")) return;
    const topic = text.slice(5);
    // Function to generate the prompt for the OpenAI API
    // In the future, it will be moved to a helper class in the next code review
    const generatePrompt = (topic) => {
      return `Write an blog post about "${topic}", it should in Well Whatsapp formatted format, include 5 unique points, using informative tone.`;
    };
    // Use the generateText method to generate text from the OpenAI API and passing the generated prompt, the model and max token value
    await openAI
      .generateText(generatePrompt(topic), model, 800)
      .then((textOutput) => {
        // Logging the generated text to the console
        // In the future, this will be replaced to upload the returned blog text to a WordPress site using the WordPress REST API
        const trimmedText = textOutput.trimStart().replace(/^\n/, "");
        sendMessage(key.remoteJid, { text: trimmedText }, { quoted: msg });
        console.log(textOutput);
      })
      .catch((error) => {
        console.error(error);
      });
  };
  const handleCommand = async (msg) => {
    const { key, message } = msg;
    const text = getText(message);
    if (!text.toLowerCase().startsWith("@commands")) return;
    const command =
      "*@all* - to tag all users\n*@mirror* - to mirror your text\n*@commands* - to list all commands\n*@ask* - to ask openai\n*@ytd* - to download youtube video, put one space after ytd and have patience while it gets downloaded";
    sendMessage(key.remoteJid, { text: command }, { quoted: msg });
  };
  const handleMirror = async (msg) => {
    const { key, message } = msg;
    const text = getText(message);
    const prefix = "@mirror";
    if (!text.startsWith(prefix)) return;
    const reply = text.slice(prefix.length);
    console.log(reply);
    sendMessage(key.remoteJid, { text: reply });
  };
  const handleAll = async (msg) => {
    const { key, message } = msg;
    const text = getText(message);
    // @all @All
    if (!text.toLowerCase().startsWith("@all")) return;
    // 1. Get All Group Members
    // 2. Tag Them And Reply
    const group = await sock.groupMetadata(key.remoteJid);
    const members = group.participants;

    // Creating two arrays
    const mentions = [];
    const items = [];
    members.forEach(({ id, admin }) => {
      mentions.push(id);
      items.push(`@${id.slice(0, 12)}${admin ? "👑" : ""}`);
    });
    sendMessage(
      key.remoteJid,
      { text: "Hey\n" + items.join(", "), mentions },
      { quoted: msg }
    );
  };
  sock.ev.process(async (events) => {
    if (events["connection.update"]) {
      const { connection, lastDisconnect } = events["connection.update"];
      if (connection === "close") {
        if (
          lastDisconnect?.error?.output?.statusCode !==
          DisconnectReason.loggedOut
        ) {
          WABot();
        } else {
          console.log("Disconnected because you logged out");
        }
      }
    }
    if (events["creds.update"]) {
      await saveCreds();
    }
    if (events["messages.upsert"]) {
      const { messages } = events["messages.upsert"];
      messages.forEach((msg) => {
        if (!msg.message) return;
        // !mirror hello
        // processing
        handleMirror(msg);
        handleAll(msg);
        handleCommand(msg);
        handleAi(msg);
        handleYTDownload(msg);
        handleIG(msg);
      });
    }
  });
}

WABot();
