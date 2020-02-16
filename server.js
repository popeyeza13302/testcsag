let express = require('express')
let cors = require('cors')


const PORT = process.env.PORT || 3000


const { Client } = require('pg')
const client = new Client({
    host: '13.76.33.58',
    user: 'postgres',
    password: 'P@$$',
    database: 'TueKan',
    ssl: false,
    port: '5432'
})

client.connect()

let app = express()

app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.post('/api/user/login', (req, res) => {
    /// ให้ ส่งข้อความอะไรสักอย่างหากเกิด status 40x
    let { username, password } = req.body
    if (!(username && password)) {
        res.status(400).send("FUCKING ERROR : 400 Username and password mismatch!");
    }
    client.query( 'SELECT username FROM account WHERE username=$1' /* *ใส่ query string ที่แสดงค่า user ที่มี username=$1จาก table account */, [username], (err, data) => {
        if (err) {
            res.status(401).send("FUCKING ERROR : 401 WHAT THE HELL IS HAPPENING??");
        }
        else if (data.rows[0] == undefined) {
            res.status(401).send("FUCKING ERROR : 401 data rows is undefined.");
        }
        else {
            if (data.rows[0]['password'] != password) {
                res.status(401).send("FUCKING ERROR : 401 wrong password.");
            }
            else {
                res.status(202).send("This is GOOOOOOOD");
            }
        }
    })

})

app.post('/api/user', (req, res) => {
    let { username, password } = req.body
    client.query('INSERT INTO account(username,password) VALUES ($1,$2)', [username, password],
        (err) => {
            if (err) {
                console.log(err.stack)
                ///ส่งข้อความบอก error (อะไรก็ได้)
                res.status(406).send("FUCKING ERROR : 406 WHAAAAAT? err stack??");
            } else {
                ///ส่งข้อความบอกว่าสร้างบัญชีเสร็จแล้ว (อะไรก็ได้)
                res.status(201).send("WOW, You are done!");
            }
        })

})

app.get('/api/posts', async (req, res) => {
    client.query('SELECT * FROM post'/* *ใส่ query string ให้แสดงค่าทั้งหมด ใน table posts */, (err, data) => {
        if (err) {
            console.log(err.stack)
        } else {
            let tosend = data.rows
            res.json(tosend);
            ///ส่ง tosend ในรูปแบบ json กลับไป
        }
    })
})

app.post('/api/posts', (req, res) => {
    let { name, topic, content } = req.body
    client.query('INSERT INTO post(username,topic,content) VALUES ($1,$2,$3) RETURNING id', [name, topic, content],
        (err,data) => {/* *เพิ่มค่า(username,topic,content) ลง table post ต่อจาก VALUES ให้ใส่ ($1,$2,$3) RETURNING id ไปเลย*/
            if (err) {
                console.log(err.stack)
            }else{
                res.status(201).send(data.rows[0].id.toString())
            }
        })
})

app.get('/api/posts/:id', (req, res) => {
    let { id } = req.params
    let forsend;
    client.query('SELECT * FROM post WHERE id=$1', [id], (err, data) => {
        if (err) {
            console.log(err.stack)
        } else {
            forsend = data.rows[0]
        }
    })
    client.query('SELECT * FROM comment WHERE post_id=$1', [id], (err, data) => {
        if (err) {
            console.log(err.stack)
        } else {
            console.log(data.rows)
            let allcomment = { ...forsend, comment: [...data.rows] }
            res.send(allcomment);
            ///ส่ง allcomment กลับไป
        }
    })
})

app.post('/api/posts/:id/reply', (req, res) => {
    let { id } = req.params
    let { name, reply } = req.body
    client.query('INSERT INTO comment(post_id,username,reply) VALUES ($1,$2,$3)', [id, name, reply],
        (err) => {
            if (err) {
                console.log(err.stack)
            }
        })
    res.status(202).send('Reply success')
})

app.listen(PORT, () => {
    console.log(`running on port ${PORT}`)
})

