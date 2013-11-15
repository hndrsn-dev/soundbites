<?php

class DB {
  
  public static function getConn() {
    try {
      
      $conn = new PDO('mysql:host=localhost;dbname=sounds', "root", "quarterMic7");
      $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      
      return $conn;
      
    } catch(PDOException $e) {
      
      echo 'Connection Failure: ' . $e->getMessage();
    }
  }
}



?>