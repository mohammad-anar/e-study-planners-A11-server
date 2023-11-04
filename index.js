const express = require('express')
const app = express()
const port = process.env.PORT || 5001



app.get('/', (req, res) => {
    res.send("eStudypartners server is running");
})

app.listen(port, () => {
    console.log(`eStudy app is running form port: ${port}`);
})