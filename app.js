const express = require('express')
const app = express()
const fs = require('fs')

app.use(express.static('./public'))

app.get('/', (req, res) => {
  res.end(fs.readFileSync('./index.html'))
})

app.listen(3000)