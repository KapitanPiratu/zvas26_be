const { get } = require("../helpers");

async function checkpointCheck(req, res) {
    const key = req.body["key"];

    if (!key) {
        res.status(400).send({ error: "Missing required fields: key" });
    }

    try {
        const checkpoint = await get("SELECT * FROM checkpoint WHERE key = ?", [
            key,
        ]);

        if (!checkpoint) {
            res.status(404).send({ error: "Wrong key" });
        } else {
            res.status(200).send({ id: checkpoint.id, name: checkpoint.name });
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}

module.exports = { checkpointCheck };
