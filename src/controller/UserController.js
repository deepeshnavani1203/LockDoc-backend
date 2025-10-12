const supabase = require("../connection/connect");

const generateId = () => {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  let id = "#u";
  for (let i = 0; i < 5; i++) {
    id += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  console.log(id);
  return id;
};

const signup = async (req, res) => {
  const { name, email, pass, cpass } = req.body;

  try {
    if (!name || !email || !pass || !cpass)
      return res.status(400).json({ message: "All fields are required!!" });

    if (pass !== cpass)
      return res.status(400).json({ message: "Passwords do not match!" });

    const { data: existingUser, error: fetchError } = await supabase
      .from("login")
      .select("*")
      .eq("email", email);

    if (fetchError) throw fetchError;

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already exists!" });
    }

    const { data, error } = await supabase
      .from("login")
      .insert([{ id: generateId(), name, email, pass }])
      .select();

    if (error) throw error;

    return res.status(200).json({ message: "Signup successful!", data: data });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json({ message: "Unable to insert", error: error.message });
  }
};

const login = async (req, res) => {
  const { email, pass } = req.body;

  try {
    if (!email || !pass)
      return res
        .status(400)
        .json({ message: "Email and password are required!!" });

    const { data: user, error } = await supabase
      .from("login")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.status(400).json({ message: "Email does not exist!" });
    }

    if (user.pass !== pass) {
      return res.status(400).json({ message: "Incorrect password!" });
    }

    return res.status(200).json({ message: "Login successful!" });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json({ message: "Login failed", error: error.message });
  }
};

module.exports = {
  signup,
  login,
};
