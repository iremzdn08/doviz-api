const express = require("express");
const sql = require("mssql");
const app = express();

app.use(express.json());

const config = {
  server: "N101155",
  database: "doviz",
  user: "iremtest", // SQL Server Authentication kullanıcı adı
  password: "iremtest", // şifre
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

// POST: CurrencyRates tablosuna yeni veri ekleme
app.post("/currency/latest", async (req, res) => {
  const { CurrencyCode, RateToUSD } = req.body;

  if (!CurrencyCode || !RateToUSD) {
    return res.status(400).json({ error: "Eksik veri gönderildi." });
  }

  try {
    // SQL bağlantısı
    await sql.connect(config);

    // Insert sorgusu
    const query = `
      INSERT INTO [dbo].[CurrencyRates] (CurrencyCode, RateToUSD, LastUpdated)
      VALUES (@CurrencyCode, @RateToUSD, GETDATE());
    `;

    await sql.query`
      INSERT INTO [dbo].[CurrencyRates] (CurrencyCode, RateToUSD, LastUpdated)
      VALUES (${CurrencyCode}, ${RateToUSD}, GETDATE())
    `;

    res.json({ message: "Veri başarıyla eklendi", CurrencyCode, RateToUSD });
  } catch (err) {
    console.error("SQL hata:", err);
    res.status(500).json({ error: "Sunucu hatası veya SQL bağlantı sorunu" });
  }
});


// GET: CurrencyRates tablosundaki son kayıtları getir
app.get("/currency/latest", async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query(`
      SELECT TOP (10) Id, CurrencyCode, RateToUSD, LastUpdated
      FROM [dbo].[CurrencyRates]
      ORDER BY LastUpdated DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("SQL hata:", err);
    res.status(500).json({ error: "Veriler alınamadı" });
  }
});

app.get("/", (req, res) => {
    res.send("Ana sayfa çalışıyor");
});

app.get("/currency/convert", async (req, res) => {
    const { from, to, amount } = req.query;

    if (!from || !to || !amount) {
        return res.status(400).json({ error: "Eksik parametre" });
    }

    try {
        await sql.connect(config);
        const result = await sql.query(`
            SELECT RateToUSD 
            FROM [dbo].[CurrencyRates]
            WHERE CurrencyCode = '${from}'
        `);
        const fromRate = result.recordset[0].RateToUSD;

        const toResult = await sql.query(`
            SELECT RateToUSD 
            FROM [dbo].[CurrencyRates]
            WHERE CurrencyCode = '${to}'
        `);
        const toRate = toResult.recordset[0].RateToUSD;

        const convertedAmount = (toRate / fromRate) * Number(amount);

        res.json({ from, to, amount, convertedAmount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Dönüştürme yapılamadı" });
    }
});




app.listen(3000, () => console.log("Server http://localhost:3000 üzerinde çalışıyor"));
