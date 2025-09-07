const mongoose = require('mongoose');
const User = require('./src/apps/user/models/models');
const bcrypt = require('bcrypt');
require('dotenv').config();

const updateExistingUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar usuarios con contraseñas que no están hasheadas
    // (las contraseñas hasheadas con bcrypt empiezan con $2b$)
    const users = await User.find({
      password: { $not: /^\$2b\$/ }
    });

    console.log(`📊 Usuarios encontrados con contraseñas sin hashear: ${users.length}`);

    if (users.length === 0) {
      console.log('✅ Todos los usuarios ya tienen contraseñas hasheadas');
      return;
    }

    const saltRounds = 10;

    for (let user of users) {
      const originalPassword = user.password;
      const hashedPassword = await bcrypt.hash(originalPassword, saltRounds);
      
      user.password = hashedPassword;
      await user.save();
      
      console.log(`✅ Usuario actualizado: ${user.email}`);
      console.log(`   Original: ${originalPassword}`);
      console.log(`   Hasheada: ${hashedPassword.substring(0, 20)}...`);
    }

    console.log(`✅ ${users.length} usuarios actualizados correctamente`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
};

updateExistingUsers();
