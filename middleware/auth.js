
// Проверяем авторизацию
module.exports = function(req, res, next) {
  // если параметр => req.session.isAuthenticated не true,
  // значит пользователь не вошел в систему.
  if (!req.session.isAuthenticated) {
    // перенаправляем в страницу авторизации
    return res.redirect('/auth/login')
  }

  next()
}