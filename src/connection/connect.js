const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseKey = process.env.supabasekey;
const supabaseUrl = process.env.supabaseurl;

const supabase = createClient(supabaseUrl, supabaseKey);

const makeconnect = async () => {
  try {
    if (supabase) {
      return true;
    }
  } catch (err) {
    return false;
  }
};

makeconnect();

module.exports = supabase;
