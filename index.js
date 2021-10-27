// import fetch from "node-fetch";
import fetch from "node-fetch";
import express from "express";
import fs from "fs";
const fsp = fs.promises;
const app = express();

const server = app.listen(3000, () => {
    console.log("Listening at 3000");
});

app.use("/search", express.static("public"));
app.use(
    express.json({
        limit: "1mb",
    })
);

app.get("/search");

async function getClassInfo(name, crn) {
    let body = {
        group: "code:" + name,
        key: "crn:" + crn,
        srcdb: "202110",
        // matched: "crn:17551,17553,17554,17555,17556"
    };
    let resp = await fetch("https://cab.brown.edu/api/?page=fose&route=details", {
        headers: {
            accept: "application/json, text/javascript, */*; q=0.01",
            // "accept-language": "en-US,en;q=0.9",
            "content-type": "application/json",
            // "sec-ch-ua": '"Chromium";v="94", "Google Chrome";v="94", ";Not A Brand";v="99"',
            // "sec-ch-ua-mobile": "?0",
            // "sec-ch-ua-platform": '"macOS"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            // cookie: "TS01b3a32b=014b44e76b599ec4d9da245bfeb785cd0dde13cb460f7764208cb84bed7892aa077ea4cf04db649a5f85df61f7f37b5cc5b4d3e895; TS016d0986=014b44e76b1a26b37fdbb9eddcb61c1988f11c44c4f993f2a612ddc824b56357746a5a3a7024df0dff269a656f28be2e43670cfc5f; SESSf87c02c394f0e8506799a08bd17e40a1=uerq8tgnj263764k95ba8q4034; IDMSESSID=9AA74B0C38C47A73DEF9633286DC9EB9061EADBBA9CFA2F9C966F4665A0B602216D6C74AB522008AEF527E532F0135D1",
        },
        referrer: "https://cab.brown.edu/",
        referrerPolicy: "strict-origin-when-cross-origin",
        body: JSON.stringify(body),
        method: "POST",
        mode: "cors",
    });
    let json = await resp.json();
    return json;
}

async function searchClases(term) {
    console.log("Searching for " + term);
    let body = {
        other: { srcdb: "202110" },
        criteria: [
            { field: "keyword", value: term },
            { field: "is_ind_study", value: "N" },
            { field: "is_canc", value: "N" },
        ],
    };
    let resp = await fetch("https://cab.brown.edu/api/?page=fose&route=search&keyword=MATH&is_ind_study=N&is_canc=N", {
        headers: {
            accept: "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/json",
            "sec-ch-ua": '"Chromium";v="94", "Google Chrome";v="94", ";Not A Brand";v="99"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"macOS"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
        },
        referrer: "https://cab.brown.edu/",
        referrerPolicy: "strict-origin-when-cross-origin",
        body: JSON.stringify(body),
        method: "POST",
        mode: "cors",
        credentials: "include",
    });
    let json = await resp.json();

    let classes = [];
    let classList = JSON.parse(await fsp.readFile("classList.json", "utf8"));

    if (term == "*") {
        console.log("Found all " + classList.length + " classes!");
        return classList;
    }

    let changes = 0;
    for (let result of json.results) {
        if (!classes.map(e => e.code).includes(result.code)) {
            if (classList.map(e => e.code).includes(result.code)) {
                let classListIndex = classList.map(e => e.code).indexOf(result.code);
                classes.push(classList[classListIndex]);
            } else {
                let classInfo = await getClassInfo(result.code, result.crn);
                classes.push(classInfo);
                classList.push(classInfo);
                changes++;
            }
        }
    }

    if (changes) {
        await fsp.writeFile("classList.json", JSON.stringify(classList));
        console.log("updated " + changes + " classes!");
    }

    console.log("Found " + classes.length + " results!");

    return classes;
}

app.get("/searchClasses/:term", async (request, response) => {
    response.json(await searchClases(request.params.term));
});

// searchClases("MATH").then(console.log);
// getClassInfo("MATH 1260", "17584").then(console.log);
