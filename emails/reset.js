const keys = require('../keys')

module.exports = function(email, token) {
    return {
        to: email,
        from: keys.EMAIL_FROM,
        subject:  'Восстановление пароля',
        html: `
            <h3>Восстановление пароля</h3>
            <p>Для восстановления пароля перейдите по следующей ссылке:</p>
            <hr />
            <p><a href="${keys.BASE_URL}/auth/password/${token}" target="_blank">Восстановить пароль</a></p>
            <hr />
            <a href="${keys.BASE_URL}" target="_blank">Перейти в Магазин </a>
        ` 
    }
}