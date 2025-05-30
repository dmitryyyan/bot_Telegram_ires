const express = require("express");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");

// Встав сюди свій токен прямо тут:
const TOKEN = "7410521054:AAGD-zwOpj-20krhnpDB_C5bvvtBuWUU6y8";

const bot = new TelegramBot(TOKEN, { polling: true });
const server = express();

const port = process.env.PORT || 5000;
const gameName = "irys_clicker"; // правильний game_short_name

const queries = {};

server.use(express.static(path.join(__dirname, 'public')));

bot.onText(/help/, (msg) => bot.sendMessage(msg.from.id, "Say /game if you want to play."));
bot.onText(/start|game/, (msg) => bot.sendGame(msg.from.id, gameName));

bot.on("callback_query", (query) => {
    if (query.game_short_name !== gameName) {
        bot.answerCallbackQuery({
            callback_query_id: query.id,
            text: `Sorry, '${query.game_short_name}' is not available.`,
            show_alert: false
        });
    } else {
        queries[query.id] = query;
        const gameurl = "https://tap-clicker-project.web.app";
        bot.answerCallbackQuery({
            callback_query_id: query.id,
            url: gameurl
        });
    }
});

bot.on("inline_query", (iq) => {
    bot.answerInlineQuery(iq.id, [{
        type: "game",
        id: "0",
        game_short_name: gameName
    }]);
});

server.get("/highscore/:score", (req, res, next) => {
    if (!Object.hasOwnProperty.call(queries, req.query.id)) return next();

    const query = queries[req.query.id];
    let options;

    if (query.message) {
        options = {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id
        };
    } else {
        options = {
            inline_message_id: query.inline_message_id
        };
    }

    bot.setGameScore(query.from.id, parseInt(req.params.score), options, (err, result) => {
        if (err) {
            console.error("Error setting game score:", err);
            return res.status(500).send("Error setting game score");
        }
        res.send("Score updated");
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
