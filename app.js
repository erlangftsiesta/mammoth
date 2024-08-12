const express = require('express');
const mammoth = require('mammoth');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();
const PORT = 7771;

// Konfigurasi multer untuk penyimpanan sementara file yang diunggah
const upload = multer({ dest: 'uploads/' });

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cbt-unit_test'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL Database.');
});

app.use(express.static(path.join(__dirname, 'public/img/ ')));
app.use(express.static(path.join(__dirname, 'public/js/ ')));
app.use(express.static(path.join(__dirname, 'public/')));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.get('/', async (req, res) => {
    const sql = 'SELECT mapel FROM soal WHERE mapel IS NOT NULL AND mapel != ""';
    db.query(sql, (err, results) => {
        if (err) throw err;

        // Extract unique mapel values
        const uniqueMapel = [...new Set(results.map(result => result.mapel))];

        res.render('index', {
            mapel: uniqueMapel,
        });
    });
})



//===========================================================================================================================
app.get('/api/v1/get/soal/:mapel', (req, res) => {
    const mapel = req.params.mapel;

    // Query SQL untuk mengambil data soal berdasarkan mapel
    const sql = `SELECT soal_id, soal, jawaban_text, jawaban_alphabet, arrayJawabanText, questionImage, arrayAnswerImages 
                 FROM soal 
                 WHERE mapel = ?`;

    db.query(sql, [mapel], (err, results) => {
        if (err) {
            console.error('Error executing SQL query:', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        if (results.length === 0) {
            res.status(404).send('Data soal tidak ditemukan');
            return;
        }

        // Format hasil query sesuai kebutuhan respons
        const formattedResults = results.map(result => ({
            soal_id: result.soal_id,
            soal: result.soal,
            jawaban_text: result.jawaban_text,
            jawaban_alphabet: result.jawaban_alphabet,
            arrayJawabanText: JSON.parse(result.arrayJawabanText),
            questionImage: result.questionImage,
            arrayAnswerImages: JSON.parse(result.arrayAnswerImages)
        }));

        res.json({
            mapel: mapel,
            questions: formattedResults
        });
    });
});

//===========================================================================================================================

app.get('/api/v1/get/nama-mapel-ujian', async (req, res) => {
    const sql = 'SELECT mapel FROM results WHERE mapel IS NOT NULL AND mapel != ""';
    db.query(sql, (err, results) => {
        if (err) throw err;

        // Extract unique mapel values
        const uniqueMapel = [...new Set(results.map(result => result.mapel))];

        res.render('index', {
            mapel: uniqueMapel,
        });
    });
})


app.post('/api/v1/post/insert-data-guru', async (req, res) => {
    const {dataGuru} = req.body
    //nig, nama, kode_guru, id_mapel_kelas, password

    try {
         const insertDataGuru = `INSERT INTO guru (nig, nama, kode_guru, id_mapel_kelas, password) VALUES (?, ?, ?, ?, ?)`;

        await Promise.all(dataGuru.map(async (dataGuru) => {
            const {nig, nama, kode_guru, id_mapel_kelas, password} = dataGuru;
            await new Promise((resolve, rejects) => {
                db.query(insertDataGuru, [nig, nama, kode_guru, id_mapel_kelas, password], (err, result) => {
                    if (err) rejects(err)
                    resolve(result)
                });
            });
        }));
        res.send('Data saved!');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error: ' + error.message);
    }
})







app.get('/input', async(req, res) => {
    res.render('inputsoal')
})
app.post('/submit', async (req, res) => {
    const { answers } = req.body;

    try {
        // Simpan jawaban ke dalam database
        const insertAnswersQuery = `INSERT INTO soal (mapel, soal_id, soal, jawaban_text, jawaban_alphabet, arrayJawabanText, questionImage, arrayAnswerImages) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        
        // Loop untuk setiap jawaban dan simpan ke database
        await Promise.all(answers.map(async (answer) => {
            const {mapel, question_id, question_text, answer_text, answer_alphabet, arrayJawabanText, questionImage, arrayAnswerImages } = answer;
            await new Promise((resolve, reject) => {
                db.query(insertAnswersQuery, [mapel, question_id, question_text, answer_text, answer_alphabet, arrayJawabanText, questionImage, arrayAnswerImages], (err, result) => {
                    if (err) reject(err);
                    resolve(result);
                });
            });
        }));

        res.send('Data saved!');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error: ' + error.message);
    }
});


app.post('/convert', upload.single('file'), async (req, res) => {
    try {
        const inputPath = req.file.path;
        const dataBuffer = await fs.readFile(inputPath);
        const { value: html } = await mammoth.convertToHtml({ buffer: dataBuffer });

        // Hapus file yang diunggah setelah konversi
        await fs.unlink(inputPath);

        res.send(html);
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
});

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
