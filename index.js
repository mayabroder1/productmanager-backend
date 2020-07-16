const express = require('express')
var cors = require('cors')
const app = express()
const port = 3005

app.use(cors())

app.get('/projects', (req, res) => {
    const data = [
        {
            id: '1',
            name: 'project 1'
        }, {
            id: '2',
            name: 'project 2'
        }, {
            id: '3',
            name: 'project 3'
        }
    ]
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000'); 
    res.json(data);
})

app.get('/projects/:projectId', (req, res) => {
    const data = {
        projectId: req.param('projectId'),
        title: 'project title!!'
    }
    console.log('debug projectId', req.param('projectId'))
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000'); 
    res.json(data);
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))