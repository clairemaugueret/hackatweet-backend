const User = require("../models/users");

const checkToken = async (req, res, next) => {
  const token =
    req.body.token || //si le token est dans le corps de la requête
    req.headers["authorization"] || //si le token est dans les headers
    req.query.token || // si le token est passé dans l’URL en GET
    null; // si aucun token n’est trouvé

  if (!token) {
    return res.status(401).json({ result: false, error: "Token missing" });
  }

  const user = await User.findOne({ token });
  if (!user) {
    return res.status(403).json({ result: false, error: "Invalid token" });
  }

  req.user = user;
  req.token = token;
  // On attache le user et le token à l’objet req pour les rendre disponibles plus tard dans les controllers
  // Ainsi dans le controller, on peut accéder à req.user.firstname par ex. sans passer par une requête à MongoDB
  next();
};

module.exports = { checkToken };
