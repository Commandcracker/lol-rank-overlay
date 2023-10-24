import { renderToReadableStream } from "react-dom/server";
import CSS from "./App.css";
import { join } from "path";

import psList from "ps-list";
import pidCwd from "pid-cwd";

import Iron from "./assets/Tier/Iron.png";
import Bronze from "./assets/Tier/Bronze.png";
import Silver from "./assets/Tier/Silver.png";
import Gold from "./assets/Tier/Gold.png";
import Platinum from "./assets/Tier/Platinum.png";
import Emerald from "./assets/Tier/Emerald.png";
import Diamond from "./assets/Tier/Diamond.png";
import Master from "./assets/Tier/Master.png";
import Grandmaster from "./assets/Tier/Grandmaster.png";
import Challenger from "./assets/Tier/Challenger.png";

import Gray from "./assets/TFTTier/Gray.png";
import Green from "./assets/TFTTier/Green.png";
import Blue from "./assets/TFTTier/Blue.png";
import Purple from "./assets/TFTTier/Purple.png";
import Hyper from "./assets/TFTTier/Orange.png";

async function searchProcess(processes, targetName) {
    const results = processes.filter((process) =>
        process.name.includes(targetName)
    );
    return results.length > 0 ? results : null;
}

const Queue = {
    RANKED_FLEX_SR: "Ranked Flex",
    RANKED_SOLO_5x5: "Ranked Solo/Duo",
    RANKED_TFT: "Ranked TFT",
    RANKED_TFT_DOUBLE_UP: "Ranked TFT Double Up",
    RANKED_TFT_PAIRS: "Ranked TFT (Double Up Beta)", // Deprecated ?
    RANKED_TFT_TURBO: "Ranked TFT Hyper Roll",
};

function getKeyByValue(object, value) {
    return Object.keys(object).find((key) => object[key] === value);
}

const mode = Queue.RANKED_FLEX_SR;
const mode_str = getKeyByValue(Queue, mode);

class LUC {
    constructor() {
        this.process_name = null;
        this.process_id = null;
        this.port = null;
        this.password = null;
        this.protocol = null;

        this.last_pid = null;
    }
    async from_folder(path) {
        const lockfile = Bun.file(join(path, "lockfile"));
        if (await lockfile.exists()) {
            const lockfile_content = (await lockfile.text()).split(":");
            this.process_name = lockfile_content[0];
            this.process_id = Number(lockfile_content[1]);
            this.port = Number(lockfile_content[2]);
            this.password = btoa("riot:" + lockfile_content[3]);
            this.protocol = lockfile_content[4];
            this.last_pid = process.pid;
            return true;
        }
        return false;
    }
    async detect() {
        const processes = await psList();
        const targetProcessName = "LeagueClient";
        const foundProcess = await searchProcess(processes, targetProcessName);

        for (const process of foundProcess) {
            // Nothing to do
            if (process.pid == this.last_pid) return true;
        }

        for (const process of foundProcess) {
            const cwd = await pidCwd(process.pid);
            if (await this.from_folder(cwd)) return true;
        }
        // No process found
        return false;
    }
    get_url(path) {
        if (this.protocol && this.port && path)
            return this.protocol + "://127.0.0.1:" + this.port + path;
        else return null;
    }
    get_headers() {
        if (this.password) return { Authorization: "Basic " + this.password };
        else return null;
    }
}

const luc = new LUC();
await luc.detect();

function title(string) {
    return string.charAt(0).toUpperCase() + string.toLowerCase().slice(1);
}

var image = null;
var text1 = null;
var text2 = null;

async function updateRank() {
    await luc.detect();

    const response = await fetch(
        luc.get_url("/lol-ranked/v1/current-ranked-stats"),
        {
            headers: luc.get_headers(),
        }
    );
    const html = await response.json();
    const stats = html["queueMap"][mode_str];

    var tier = null;

    if (mode === Queue.RANKED_TFT_TURBO) {
        tier = title(stats["ratedTier"]);
        const ratedRating = Number(stats["ratedRating"]);

        text1 = `${tier} ${ratedRating} Points`;
        text2 = null;
    } else {
        tier = title(stats["tier"]);
        const rank = tier + " " + stats["division"];
        const winsLosese = stats["wins"] + "W " + stats["losses"] + "L";
        const lp = stats["leaguePoints"] + "LP";

        const games = Number(stats["wins"]) + Number(stats["losses"]);
        const winrate = (Number(stats["wins"]) / games) * 100;
        const winratetext = winrate.toFixed(0) + "%";

        text1 = `${rank} ${winsLosese}`;
        text2 = `${lp} ${winratetext} Winrate`;
    }
    image = tier + ".png";
}

await updateRank();
setInterval(updateRank, 2000);

const jsc = `setTimeout(function(){
  location.reload();
}, 2000);`;

const App = () => (
    <html>
        <head>
            <title>Test</title>
            <link rel="stylesheet" type="text/css" href="App.css" />
            <script>{jsc}</script>
        </head>
        <body>
            <div id="main">
                <img src={image} alt="Logo" />
                <div id="text">
                    <p>{text1}</p>
                    <p>{text2}</p>
                </div>
            </div>
        </body>
    </html>
);

const routes = {
    "/Iron.png": Iron,
    "/Bronze.png": Bronze,
    "/Silver.png": Silver,
    "/Gold.png": Gold,
    "/Platinum.png": Platinum,
    "/Emerald.png": Emerald,
    "/Diamond.png": Diamond,
    "/Master.png": Master,
    "/Grandmaster.png": Grandmaster,
    "/Challenger.png": Challenger,
    "/App.css": CSS,
    "/Gray.png": Gray,
    "/Green.png": Green,
    "/Blue.png": Blue,
    "/Purple.png": Purple,
    "/Hyper.png": Hyper,
};

const port = Number(process.env.PORT || 3001);
const headers = {
    headers: {
        "Content-Type": "text/html",
    },
};

Bun.serve({
    port,
    async fetch(req) {
        const path = new URL(req.url).pathname;
        console.log(path);
        if (path in routes) return new Response(Bun.file(routes[path]));
        return new Response(await renderToReadableStream(<App />), headers);
    },
});

console.log(`Server running on "http://localhost:${port}"`);
