
const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const bodyParser = require('body-parser');
// import { v4 as uuidv4 } from 'uuid';

const app = express();

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

app.use(bodyParser.json());
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


const allStaffs = JSON.parse(fs.readFileSync('staffs.json'));
const loans = JSON.parse(fs.readFileSync('loans.json'));

const secret_code = '12345677';

const supAd = (req, res, next) => {
    if (req.user.role === 'superadmin') {
        return next();
    } else {
        return res.sendStatus(403);
    }
};

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = allStaffs.find(user => user.email === email && user.password === password);

    if (!user) {
        return res.status(401).send('Invalid email or password');
    }

    const accessToken = jwt.sign({ email: user.email, role: user.role }, secret_code);
    res.json({ accessToken });
});

app.post('/logout', verifyToks, (req, res) => {
    res.sendStatus(204);
});


app.get('/loans', (req, res) => {
    const userRole = req.user.role;
    let sending = loans;
    if (userRole !== 'admin' && userRole !== 'superadmin') {
        sending = loans.map(loan => ({ ...loan, totalLoan: undefined }));
    }
    res.json(sending);
});

app.get('/loans', (req, res) => {
    const { status } = req.query;
    const checks = loans.filter(loan => loan.status === status);
    res.json(checks);
});

app.get('/loans/:staffEmail', (req, res) => {
    const staffEmail = req.params.staffEmail;
    const userLoans = loans.filter(loan => loan.staffEmail === staffEmail);
    res.json({ loans: userLoans });
});

app.get('/loans/expired', (req, res) => {
    const expiredLoans = loans.filter(loan => new Date(loan.maturityDate) < new Date());
    res.json(expiredLoans);
});

app.delete('/loan/:loanId/delete', supAd, (req, res) => {
    const loanId = req.params.loanId;
    const index = loansData.findIndex(loan => loan.id === loanId);

    if (index === -1) {
        return res.status(404).json({ message: 'Loan not found.' });
    }

    loansData.splice(index, 1);
    res.sendStatus(204); 
});

app.use(verifyToks);

const verifyToks = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, secret_code, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};


