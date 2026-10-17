<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

function loadEnv($path) {
    if (!file_exists($path))  return false;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), "#") === 0) continue;
        list($name, $value) = explode("=", $line, 2);
        $name = trim($name);
        $value = trim($value);
        if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
            putenv(sprintf("%s=%s", $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

loadEnv(__DIR__ . "/../.env");

$host = getenv("HOST") ?: "localhost";
$port = getenv("PORT") ?: "3306";
$dbName = getenv("DB_NAME") ?: "desis_db";
$username = getenv("USERNAME") ?: "root";
$password = getenv("PASSWORD") ?: "";

try {
    $dsn = "mysql:host=" . $host . ";port=" . $port . ";dbname=" . $dbName;
    $conn = new PDO($dsn, $username, $password);
    $conn->exec("set names utf8");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    http_response_code(500);
    echo json_encode(["message" => "Connection Error: " . $exception->getMessage()]);
    exit;
}

$route = isset($_GET["route"]) ? rtrim($_GET["route"], "/") : "";
$route_parts = explode("/", $route);
$resource = $route_parts[0] ?? null;
$id = $route_parts[1] ?? null;
$method = $_SERVER["REQUEST_METHOD"];
$query_params = $_GET;

function sendResponse($code, $data) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

switch ($resource) {
    case "branch":
        if ($method === "GET") {
            if ($id) {
                $stmt = $conn->prepare("SELECT * FROM branch WHERE id = ?");
                $stmt->execute([$id]);
                sendResponse(200, $stmt->fetch(PDO::FETCH_ASSOC));
            } else {
                if (isset($query_params["storeId"])) {
                    $stmt = $conn->prepare("SELECT b.* FROM branch b JOIN store_branch sb ON b.id = sb.branch_id WHERE sb.store_id = ?");
                    $stmt->execute([$query_params["storeId"]]);
                    sendResponse(200, $stmt->fetchAll(PDO::FETCH_ASSOC));
                } else {
                    $stmt = $conn->query("SELECT * FROM branch");
                    sendResponse(200, $stmt->fetchAll(PDO::FETCH_ASSOC));
                }
            }
        }
        break;
    case "store":
    case "currency":
    case "material":
        if ($method === "GET") {
            if ($id) {
                $stmt = $conn->prepare("SELECT * FROM {$resource} WHERE id = ?");
                $stmt->execute([$id]);
                sendResponse(200, $stmt->fetch(PDO::FETCH_ASSOC));
            } else {
                if (isset($query_params["productId"])) {
                    if ($resource === "material") $stmt = $conn->prepare("SELECT m.* FROM material m JOIN product_material pm ON m.id = pm.material_id WHERE pm.product_id = ?");
                    else {
                        $column = $resource . "_id";
                        $stmt = $conn->prepare("SELECT r.* FROM {$resource} r JOIN product p ON r.id = p.{$column} WHERE p.id = ?");
                    }
                    $stmt->execute([$query_params["productId"]]);
                    sendResponse(200, $stmt->fetchAll(PDO::FETCH_ASSOC));
                } else {
                    $stmt = $conn->query("SELECT * FROM {$resource}");
                    sendResponse(200, $stmt->fetchAll(PDO::FETCH_ASSOC));
                }
            }
        }
        break;
    case "product":
        if ($method === "GET") {
            if ($id) {
                $stmt = $conn->prepare("SELECT * FROM product WHERE id = ?");
                $stmt->execute([$id]);
                $product = $stmt->fetch(PDO::FETCH_ASSOC);
                if($product) {
                    $stmtMat = $conn->prepare("SELECT material_id FROM product_material WHERE product_id = ?");
                    $stmtMat->execute([$id]);
                    $product["materials"] = $stmtMat->fetchAll(PDO::FETCH_COLUMN);
                }
                sendResponse(200, $product);
            } else {
                $sql = "SELECT * FROM product WHERE 1=1";
                $params = [];
                if (isset($query_params["storeId"])) $sql .= " AND store_id = ?"; $params[] = $query_params["storeId"];
                if (isset($query_params["branchId"])) $sql .= " AND branch_id = ?"; $params[] = $query_params["branchId"];
                if (isset($query_params["currencyId"])) $sql .= " AND currency_id = ?"; $params[] = $query_params["currencyId"];
                $stmt = $conn->prepare($sql);
                $stmt->execute($params);
                sendResponse(200, $stmt->fetchAll(PDO::FETCH_ASSOC));
            }
        }
        if ($method === "POST") {
            $data = json_decode(file_get_contents("php://input"));
            if(!empty($data->id) && !empty($data->name) && !empty($data->store_id) && !empty($data->branch_id) && !empty($data->currency_id) && !empty($data->price) && !empty($data->description) && !empty($data->materials)) {
                try {
                    $conn->beginTransaction();
                    $checkStmt = $conn->prepare("SELECT id FROM product WHERE id = ?");
                    $checkStmt->execute([$data->id]);
                    if($checkStmt->rowCount() > 0) throw new Exception("Product code not available");
                    $query = "INSERT INTO product (id, name, store_id, branch_id, currency_id, price, description) VALUES (:id, :name, :store_id, :branch_id, :currency_id, :price, :description)";
                    $stmt = $conn->prepare($query);
                    $stmt->execute([
                        ":id" => $data->id,
                        ":name" => $data->name,
                        ":store_id" => $data->store_id,
                        ":branch_id" => $data->branch_id,
                        ":currency_id" => $data->currency_id,
                        ":price" => $data->price,
                        ":description" => $data->description
                    ]);
                    $matQuery = "INSERT INTO product_material (product_id, material_id) VALUES (?, (SELECT id FROM material WHERE name = ?))";
                    $matStmt = $conn->prepare($matQuery);
                    foreach($data->materials as $materialName) $matStmt->execute([$data->id, $materialName]);
                    $conn->commit();
                    sendResponse(201, ["message" => "Product saved successfully"]);
                } catch(Exception $e) {
                    $conn->rollBack();
                    sendResponse(400, ["message" => "Product could not be saved" . $e->getMessage()]);
                }
            } else sendResponse(400, ["message" => "Incomplete data, send all required fields"]);
        }
        break;
    default:
        sendResponse(404, ["message" => "Route not found"]);
        break;
}