const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("order_management", "root", "password", {
  host: "localhost",
  dialect: "mysql",
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection successful");
  } catch (err) {
    console.error("Sequelize error:", err);
  }
})();
