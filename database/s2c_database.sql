-- phpMyAdmin SQL Dump
-- version 5.1.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Erstellungszeit: 22. Okt 2021 um 11:51
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

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `component_types`
--

CREATE TABLE `component_types` (
  `component_id` int(11) NOT NULL,
  `file_prefix` varchar(16) NOT NULL COMMENT 'Prefix for saving the image file',
  `draw_hint` varchar(256) NOT NULL COMMENT 'Text hint displayed during first stage drawing (component only).',
  `val_hint` varchar(256) NOT NULL COMMENT 'Text hint displayed during validation',
  `component_hint_img` varchar(4096) NOT NULL COMMENT 'File path to hint image with only the component (no label). Used for first stage of drawing.',
  `labeled_hint_img` varchar(4096) NOT NULL COMMENT 'File path to labeled hint image. (Used as hint durcing validation and in the second stage of drawing\r\n)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `google_user`
--

CREATE TABLE `google_user` (
  `google_id` varchar(32) NOT NULL,
  `username` varchar(32) NOT NULL,
  `score` int(16) NOT NULL,
  `untrusted` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Hat der Benutzer schon einmal etwas falsch gemacht?'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `images`
--

CREATE TABLE `images` (
  `image_id` int(11) NOT NULL,
  `component_path` varchar(4096) NOT NULL,
  `label_path` varchar(4096) NOT NULL,
  `component_type` int(11) NOT NULL,
  `drawer_id` varchar(32) NOT NULL COMMENT 'Google ID des Zeichners',
  `validator_id` varchar(32) DEFAULT NULL COMMENT 'Google ID des Validierers',
  `looked_at` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Wurde es bereits angeschaut?',
  `validated` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Als korrekt markiert?',
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `component_types`
--
ALTER TABLE `component_types`
  ADD PRIMARY KEY (`component_id`);

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
  ADD KEY `validator_id` (`validator_id`),
  ADD KEY `images_ibfk_3` (`component_type`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `component_types`
--
ALTER TABLE `component_types`
  MODIFY `component_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT für Tabelle `images`
--
ALTER TABLE `images`
  MODIFY `image_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
