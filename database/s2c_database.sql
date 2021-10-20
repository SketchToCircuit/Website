-- phpMyAdmin SQL Dump
-- version 5.1.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Erstellungszeit: 20. Okt 2021 um 16:26
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
  `draw_hint` varchar(256) NOT NULL COMMENT 'Text hint displayed during drawing',
  `val_hint` varchar(256) NOT NULL COMMENT 'Text hint displayed during validation',
  `hint_img` varchar(4096) NOT NULL COMMENT 'File path to hint image'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Daten für Tabelle `component_types`
--

INSERT INTO `component_types` (`component_id`, `file_prefix`, `draw_hint`, `val_hint`, `hint_img`) VALUES
(1, 'R_H', 'Bitte zeichnen Sie einen horizontal gelegenen Widerstand!', 'Ist hier ein horizontaler Widerstand abgebildet?', '../Images/Hints/R_H.jpeg'),
(2, 'R_V', 'Bitte zeichnen Sie einen vertikal gelegenen Widerstand!', 'Ist hier ein vertikaler Widerstand abgebildet?', '../Images/Hints/R_V.jpeg');

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `google_user`
--

CREATE TABLE `google_user` (
  `google_id` varchar(32) NOT NULL,
  `untrusted` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Hat der Benutzer schon einmal etwas falsch gemacht?'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `images`
--

CREATE TABLE `images` (
  `image_id` int(11) NOT NULL,
  `image_path` varchar(4096) NOT NULL,
  `component_type` int(11) NOT NULL,
  `drawer_id` varchar(32) NOT NULL COMMENT 'Google ID des Zeichners',
  `validator_id` varchar(32) DEFAULT NULL COMMENT 'Google ID des Validierers',
  `looked_at` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Wurde es bereits angeschaut?',
  `validated` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Als korrekt markiert?',
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Daten für Tabelle `images`
--

INSERT INTO `images` (`image_id`, `image_path`, `component_type`, `drawer_id`, `validator_id`, `looked_at`, `validated`, `timestamp`) VALUES
(1, '../Images/R_H_1.jpg', 1, '11527227101223895204', NULL, 0, 0, '2021-10-20 13:44:02');

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
  MODIFY `component_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT für Tabelle `images`
--
ALTER TABLE `images`
  MODIFY `image_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
