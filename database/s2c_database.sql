-- phpMyAdmin SQL Dump
-- version 5.1.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Erstellungszeit: 30. Sep 2021 um 10:23
-- Server-Version: 10.4.18-MariaDB
-- PHP-Version: 8.0.3

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `s2c_database`
--
CREATE DATABASE IF NOT EXISTS `s2c_database` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `s2c_database`;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `google_user`
--

CREATE TABLE `google_user` (
  `google_id` varchar(20) NOT NULL,
  `untrusted` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Hat der Benutzer schon einmal etwas falsch gemacht?'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `images`
--

CREATE TABLE `images` (
  `image_id` int(11) NOT NULL,
  `image_path` varchar(4096) NOT NULL,
  `drawer_id` varchar(20) NOT NULL COMMENT 'Google ID des Zeichners',
  `validator_id` varchar(20) NOT NULL COMMENT 'Google ID des Validierers',
  `looked_at` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Wurde es bereits angeschaut?',
  `validated` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Als korrekt markiert?',
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `google_user`
--
ALTER TABLE `google_user`
  ADD PRIMARY KEY (`google_id`);

--
-- Indizes für die Tabelle `images`
--
ALTER TABLE `images`
  ADD PRIMARY KEY (`image_id`),
  ADD KEY `drawer_id` (`drawer_id`),
  ADD KEY `validator_id` (`validator_id`);

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `images`
--
ALTER TABLE `images`
  ADD CONSTRAINT `images_ibfk_1` FOREIGN KEY (`drawer_id`) REFERENCES `google_user` (`google_id`),
  ADD CONSTRAINT `images_ibfk_2` FOREIGN KEY (`validator_id`) REFERENCES `google_user` (`google_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
