const express = require('express');
const https = require("https");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.engine("ejs", require("ejs").renderFile);
app.set("view engine", "ejs");

var character = "";

app.get('/infoGOT/:id', (req, res) => {
    const characterId = req.params.id;
    const thronesUrl = `https://ThronesApi.com/api/v2/Characters/${characterId}`;

    // Thrones API
    https.get(thronesUrl, (response) => {
        let resContent = "";

        response.on("data", (data) => {
            resContent += data;
        }).on("end", () => {
            try {
                const jsonObj = JSON.parse(resContent);
                console.log("Thrones API Response:", jsonObj);
                character = jsonObj;

            
                if (!character.title || !character.family || !character.born) {
                    const iceAndFireUrl = `https://anapioficeandfire.com/api/characters/${characterId}`;
                    https.get(iceAndFireUrl, (response) => {
                        let iceResContent = "";

                        response.on("data", (data) => {
                            iceResContent += data;
                        }).on("end", () => {
                            try {
                                const iceJsonObj = JSON.parse(iceResContent);
                                console.log("Ice and Fire API Response:", iceJsonObj);
                                
                                // Busca info
                                character.title = character.title || iceJsonObj.titles.join(', ');
                                character.family = character.family || iceJsonObj.allegiances.join(', ');
                                character.born = character.born || iceJsonObj.born || "Unknown"; 
                                character.died = character.died || iceJsonObj.died || "N/A"; 

                                // Render the homepage with combined character data
                                res.redirect("/");
                            } catch (error) {
                                console.error("Error parsing JSON from Ice and Fire API:", error);
                                res.redirect("/");
                            }
                        }).on("error", (e) => {
                            console.error(`Got an error: ${e.message}`);
                            res.redirect("/"); 
                        });
                    });
                } else {
                    // Render the homepage if all needed information is present
                    res.redirect("/");
                }
            } catch (error) {
                console.error("Error parsing JSON from Thrones API:", error);
                res.redirect("/");
            }
        }).on("error", (e) => {
            console.error(`Got an error: ${e.message}`);
            res.redirect("/");
        });
    });
});

app.get('/test', (req, res) => {
    res.send('¡El servidor está funcionando correctamente!');
});

app.get('/', (req, res) => {
    res.render('home', { character: character });
});

app.listen(4000, () => {
    console.log("Listening on port 4000");
});
