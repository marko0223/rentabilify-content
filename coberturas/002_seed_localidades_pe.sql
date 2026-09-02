-- ============================================================================
-- 002 — Semilla del catálogo de localidades (Perú)
-- ============================================================================
-- Cada fila traduce lo que escribe el cliente al distrito canónico que SÍ
-- existe en cobertura_aliclik_template / cobertura_zonas.
--
-- Los alias salen de dos fuentes reales:
--   (a) el caso reportado (Llacuabamba) y su zona minera (Pataz);
--   (b) los distritos escritos en `pedidos` de los últimos 180 días que NO
--       existen en el catálogo — ordenados por volumen.
--
-- El `departamento` es obligatorio en todos los alias que se repiten en más
-- de una región. La resolución solo aplica el alias cuando el departamento
-- del pedido coincide.
-- ============================================================================

insert into public.cobertura_localidades
  (pais, alias, departamento, provincia, distrito, tipo, fuente)
values
-- ── Centros poblados: el caso reportado (Pataz, La Libertad) ──────────────
  ('PE','Llacuabamba','La Libertad','Pataz','Parcoy','centro_poblado','deperu/INEI'),
  ('PE','Retamas','La Libertad','Pataz','Parcoy','centro_poblado','deperu/INEI'),
  ('PE','Chagual','La Libertad','Pataz','Pataz','centro_poblado','deperu/INEI'),

-- ── Centros poblados de alto tráfico COD ──────────────────────────────────
  ('PE','Alto Trujillo','La Libertad','Trujillo','El Porvenir','distrito_nuevo','Ley 31644 (2022); los couriers aún lo listan como El Porvenir'),
  ('PE','Cartavio','La Libertad','Ascope','Santiago de Cao','centro_poblado',null),
  ('PE','Malabrigo','La Libertad','Ascope','Rázuri','centro_poblado',null),
  ('PE','Puerto Malabrigo','La Libertad','Ascope','Rázuri','centro_poblado',null),
  ('PE','Huaycán','Lima','Lima','Ate','centro_poblado',null),
  ('PE','Manchay','Lima','Lima','Pachacámac','centro_poblado',null),
  ('PE','Zapallal','Lima','Lima','Puente Piedra','centro_poblado',null),
  ('PE','Ñaña','Lima','Lima','Lurigancho','centro_poblado',null),
  ('PE','Huachipa','Lima','Lima','Lurigancho','centro_poblado',null),
  ('PE','Santa María de Huachipa','Lima','Lima','Lurigancho','centro_poblado',null),
  ('PE','Cajamarquilla','Lima','Lima','Lurigancho','centro_poblado',null),
  ('PE','Pachacútec','Callao','Callao','Ventanilla','centro_poblado',null),
  ('PE','Ciudad Pachacútec','Callao','Callao','Ventanilla','centro_poblado',null),
  ('PE','La Rinconada','Puno','San Antonio de Putina','Ananea','centro_poblado',null),
  ('PE','El Pedregal','Arequipa','Caylloma','Majes','centro_poblado',null),
  ('PE','Naranjillo','Huánuco','Leoncio Prado','Luyando','centro_poblado','capital del distrito'),
  ('PE','Aucayacu','Huánuco','Leoncio Prado','José Crespo y Castillo','centro_poblado','capital del distrito'),
  ('PE','Negritos','Piura','Talara','La Brea','centro_poblado','capital del distrito'),

-- ── Provincia o ciudad conocida escrita en vez del distrito capital ───────
  ('PE','Pucallpa','Ucayali','Coronel Portillo','Callería','provincia',null),
  ('PE','Coronel Portillo','Ucayali','Coronel Portillo','Callería','provincia',null),
  ('PE','Atalaya','Ucayali','Atalaya','Raymondi','provincia',null),
  ('PE','La Convención','Cusco','La Convención','Santa Ana','provincia',null),
  ('PE','Quillabamba','Cusco','La Convención','Santa Ana','provincia',null),
  ('PE','Canchis','Cusco','Canchis','Sicuani','provincia',null),
  ('PE','Huamanga','Ayacucho','Huamanga','Ayacucho','provincia',null),
  ('PE','Maynas','Loreto','Maynas','Iquitos','provincia',null),
  ('PE','Alto Amazonas','Loreto','Alto Amazonas','Yurimaguas','provincia',null),
  ('PE','San Román','Puno','San Román','Juliaca','provincia',null),
  ('PE','Mariscal Nieto','Moquegua','Mariscal Nieto','Moquegua','provincia',null),
  ('PE','Sánchez Carrión','La Libertad','Sánchez Carrión','Huamachuco','provincia',null),
  ('PE','Pasco','Pasco','Pasco','Chaupimarca','provincia',null),
  ('PE','Cerro de Pasco','Pasco','Pasco','Chaupimarca','provincia',null),
  ('PE','Chincha','Ica','Chincha','Chincha Alta','provincia',null),
  ('PE','Cañete','Lima','Cañete','San Vicente de Cañete','provincia',null),
  ('PE','Talara','Piura','Talara','Pariñas','provincia',null),
  ('PE','Leoncio Prado','Huánuco','Leoncio Prado','Rupa-Rupa','provincia',null),
  ('PE','Tingo María','Huánuco','Leoncio Prado','Rupa-Rupa','provincia',null),
  ('PE','Puerto Maldonado','Madre de Dios','Tambopata','Tambopata','provincia',null),
  ('PE','Utcubamba','Amazonas','Utcubamba','Bagua Grande','provincia',null),

-- ── Ortografías alternas ──────────────────────────────────────────────────
  ('PE','Nazca','Ica','Nasca','Nasca','ortografia',null),
  ('PE','Cuzco','Cusco','Cusco','Cusco','ortografia',null),
  ('PE','Caras','Áncash','Huaylas','Caraz','ortografia',null),
  ('PE','Rupa Rupa','Huánuco','Leoncio Prado','Rupa-Rupa','ortografia',null),

-- ── Abreviaturas y nombres de uso corriente (Lima) ────────────────────────
  ('PE','SJL','Lima','Lima','San Juan de Lurigancho','abreviatura',null),
  ('PE','SJM','Lima','Lima','San Juan de Miraflores','abreviatura',null),
  ('PE','SMP','Lima','Lima','San Martín de Porres','abreviatura',null),
  ('PE','VMT','Lima','Lima','Villa María del Triunfo','abreviatura',null),
  ('PE','VES','Lima','Lima','Villa El Salvador','abreviatura',null),
  ('PE','Cercado de Lima','Lima','Lima','Lima','abreviatura',null),
  ('PE','Lima Cercado','Lima','Lima','Lima','abreviatura',null),
  ('PE','Lima Centro','Lima','Lima','Lima','abreviatura',null),
  ('PE','Chosica','Lima','Lima','Lurigancho','abreviatura',null),
  ('PE','Lurigancho Chosica','Lima','Lima','Lurigancho','abreviatura',null),

-- ── Distrito real que falta en el catálogo importado ──────────────────────
  ('PE','26 de Octubre','Piura','Piura','Piura','distrito_nuevo','distrito creado en 2013, ausente del catálogo Aliclik')

on conflict do nothing;
