const keys = require('../keys')

module.exports = function(email) {
    return {
        to: email,
        from: keys.EMAIL_FROM,
        subject:  'Аккаунт успешно создан',
        html: `
            <h3>Добро пожаловать в Магазин!</h3>
            <p>Вы успешно создали аккаунт с email: ${email}</p>
            </hr>
            <a href="${keys.BASE_URL}" target="_blank">Перейти в Магазин </a>
        ` 
    }
}