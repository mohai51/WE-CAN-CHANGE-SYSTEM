// TODO: implement register, login, logout using bcryptjs + express-session
exports.showLogin = (req, res) => res.render('auth/login');
exports.showRegister = (req, res) => res.render('auth/register');
exports.login = async (req, res) => { /* TODO */ };
exports.register = async (req, res) => { /* TODO */ };
exports.logout = (req, res) => { req.session.destroy(() => res.redirect('/')); };
