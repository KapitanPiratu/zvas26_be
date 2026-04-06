const { get, run, execSync } = require("../helpers");

async function postNewTeam(req, res) {
    /**
     * Creates new team in db
     */
    const { name, organization, path } = req.body;
    console.log(
        `POST request to /newteam from ${req.ip}, body: ${JSON.stringify(req.body)}`,
    );

    if (!name || !organization || !path) {
        return res.status(400).send({
            error: "Missing required fields: name, organization or path.",
        });
    }

    try {
        await execSync(async () => {
            // Check if team with same name isn't already in db
            const log = await get("SELECT id FROM team WHERE name = ?", [name]);

            if (log) {
                return res.status(400).send({
                    error: "Team already exists.",
                });
            }

            const params = [name, organization, path, path];
            await run(
                "INSERT INTO team (name, organization, path_all, path) VALUES (?, ?, ?, ?)",
                params,
            );

            const createdId = await get("SELECT id FROM team WHERE name = ?", [
                name,
            ]);

            if (!res.headersSent) {
                res.status(201).send(createdId);
            }
        });
    } catch (err) {
        console.error(err);

        if (!res.headersSent) {
            res.status(500).send("Failed to create team");
        }
    }
}

module.exports = { postNewTeam };
