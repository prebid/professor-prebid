import DataFrame from "./dataframe.js";
import Row from "./row.js";
import * as Errors from "./errors.js";
import Stat from "./modules/stat.js";
import Matrix from "./modules/matrix.js";
import SQL from "./modules/sql/index.js";

DataFrame.setDefaultModules(Stat, Matrix, SQL);
DataFrame.sql = SQL;
export { DataFrame, Row, Errors };
export default DataFrame;
window.dfjs = { DataFrame, Row, Errors }