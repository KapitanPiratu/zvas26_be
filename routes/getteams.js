const { all } = require("../helpers");

async function getTeams(req, res) {
    /**
     * Returns teams from db.
     *
     * First selects all teams from db.
     * Then queries task_log for each team and calculates points from completed tasks.
     */

    // console.log(`GET request to /teams from ${req.ip}`);

    try {
        const rows = await all("SELECT * FROM team");

        for (const team of rows) {
            team.points = 0;
            const tasks = await all(
                `SELECT
                    task_log.*, task.points
                FROM
                    task_log
                LEFT JOIN
                    task
                ON
                    task.id = task_log.task_id
                WHERE
                    team_id = ?`,
                [team.id],
            );

            tasks.forEach((task) => {
                if (task.completed) team.points += task.points;
            });

            const arrival_logs = await all(
                `SELECT
                    arrival_log.*, checkpoint.name
                FROM
                    arrival_log
                LEFT JOIN
                    checkpoint
                ON
                    checkpoint.id = arrival_log.checkpoint_id
                WHERE
                    team_id = ?
                ORDER BY
                    created_at DESC`,
                [team.id],
            );

            team.logs = arrival_logs;
        }

        res.send(rows);
    } catch (err) {
        console.log(err);
        res.status(500).send("Failed to get teams");
    }
}

module.exports = { getTeams };
