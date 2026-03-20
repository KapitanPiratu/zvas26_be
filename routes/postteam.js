const { get, run } = require("../helpers");

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
        // Check if team with same name isn't already in db
        const log = await get("SELECT id FROM team WHERE name = ?", [name]);

        if (log) {
            return res.status(400).send({
                error: "Team already exists.",
            });
        }

        const params = [name, organization, path];
        await run(
            "INSERT INTO team (name, organization, path) VALUES (?, ?, ?)",
            params,
        );

        const createdId = await get("SELECT id FROM team WHERE name = ?", [
            name,
        ]);

        res.status(201).send(createdId);
    } catch (err) {
        if (!res.status) {
            res.status(500);
        }

        res.send("Failed to log arrival");
    }
}

module.exports = { postNewTeam };
