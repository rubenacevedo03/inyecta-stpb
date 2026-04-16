--
-- PostgreSQL database dump
--

\restrict OvZVsoJjXwnFzNoyRYGQYfHpePVArW30JbWRFNaqdYr7mt7L6klZg0A58fjJPaz

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: Producto; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Producto" AS ENUM (
    'PYME',
    'PERSONAL',
    'EXPRESS',
    'STPB'
);


ALTER TYPE public."Producto" OWNER TO postgres;

--
-- Name: Rol; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Rol" AS ENUM (
    'ADMIN',
    'OPERADOR',
    'CONSULTOR',
    'LEGAL'
);


ALTER TYPE public."Rol" OWNER TO postgres;

--
-- Name: StatusBloque; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusBloque" AS ENUM (
    'PENDIENTE',
    'EN_PROCESO',
    'PRE_AUTORIZADO',
    'PRE_AUTORIZADO_CONDICIONADO',
    'EXPEDIENTE_INTEGRADO',
    'DICTAMEN_VIABLE',
    'DICTAMEN_VIABLE_CONDICIONADO',
    'VALIDADO',
    'OBSERVADO',
    'FORMALIZADO',
    'RECHAZADO',
    'NO_VIABLE',
    'CERRADO'
);


ALTER TYPE public."StatusBloque" OWNER TO postgres;

--
-- Name: StatusDocumento; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusDocumento" AS ENUM (
    'PENDIENTE',
    'SOLICITADO',
    'RECIBIDO',
    'VALIDADO'
);


ALTER TYPE public."StatusDocumento" OWNER TO postgres;

--
-- Name: StatusOp; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusOp" AS ENUM (
    'PROSPECTO',
    'ANALISIS',
    'APROBADA',
    'ACTIVA',
    'LIQUIDADA',
    'EN_MORA',
    'EJECUTADA',
    'CANCELADA'
);


ALTER TYPE public."StatusOp" OWNER TO postgres;

--
-- Name: StatusPago; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusPago" AS ENUM (
    'PENDIENTE',
    'PAGADO',
    'PARCIAL',
    'VENCIDO',
    'CONDONADO'
);


ALTER TYPE public."StatusPago" OWNER TO postgres;

--
-- Name: StatusSolicitud; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusSolicitud" AS ENUM (
    'PENDIENTE',
    'EN_PROCESO',
    'COMPLETADA',
    'RECHAZADA'
);


ALTER TYPE public."StatusSolicitud" OWNER TO postgres;

--
-- Name: TipoAcreditado; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoAcreditado" AS ENUM (
    'PF',
    'PM'
);


ALTER TYPE public."TipoAcreditado" OWNER TO postgres;

--
-- Name: TipoDocumento; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoDocumento" AS ENUM (
    'IDENTIFICACION_OFICIAL',
    'CURP',
    'COMPROBANTE_DOMICILIO',
    'CONSTANCIA_SITUACION_FISCAL',
    'ESTADOS_CUENTA',
    'COMPROBANTE_INGRESOS',
    'ESCRITURAS_INMUEBLE',
    'CLG',
    'BOLETAS_PREDIALES',
    'AVALUO',
    'POLIZA_SEGURO',
    'AUTORIZACION_BURO',
    'ACTA_CONSTITUTIVA',
    'PODERES_NOTARIALES',
    'IDENTIFICACION_REP_LEGAL',
    'ALTA_SAT',
    'ESTADOS_FINANCIEROS',
    'IDENTIFICACION_INVERSIONISTA',
    'CSF_INVERSIONISTA',
    'DOMICILIO_INVERSIONISTA',
    'CLABE_INVERSIONISTA',
    'CARTA_PROPIETARIO_REAL',
    'CONVENIO_PARTICIPACION',
    'CONTRATO_CREDITO',
    'ESCRITURA_FIDEICOMISO',
    'CONVENIO_PARTICIPACION_FIRMADO',
    'INSTRUCCION_EJECUTOR',
    'NOMBRAMIENTO_EJECUTOR',
    'AVALUO_PROTOCOLIZADO',
    'EXPEDIENTE_PLD',
    'ALTA_CONDUSEF',
    'PODER_NOTARIAL_SOFOM',
    'REPORTE_VISITA',
    'DICTAMEN_CORPORATIVO',
    'DICTAMEN_GARANTIAS',
    'CONSULTA_LEGAL',
    'OTRO'
);


ALTER TYPE public."TipoDocumento" OWNER TO postgres;

--
-- Name: TipoHistorial; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoHistorial" AS ENUM (
    'CREACION',
    'CAMBIO_ESTATUS',
    'AVANCE_BLOQUE',
    'RETROCESO_BLOQUE',
    'CARGA_DOCUMENTO',
    'CAMBIO_CHECKLIST',
    'SOLICITUD_GENERADA',
    'SOLICITUD_RESPONDIDA',
    'PAGO_REGISTRADO',
    'COMENTARIO',
    'MORA_ACTIVADA',
    'AJUSTE_MORATORIO',
    'OTRO'
);


ALTER TYPE public."TipoHistorial" OWNER TO postgres;

--
-- Name: TipoNotificacion; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoNotificacion" AS ENUM (
    'SOLICITUD_RECIBIDA',
    'SOLICITUD_COMPLETADA',
    'DOCUMENTO_CARGADO',
    'BLOQUE_AVANZADO',
    'SLA_PROXIMO',
    'SLA_VENCIDO',
    'PAGO_REGISTRADO',
    'MORA_ACTIVADA',
    'COMENTARIO'
);


ALTER TYPE public."TipoNotificacion" OWNER TO postgres;

--
-- Name: TipoSolicitud; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoSolicitud" AS ENUM (
    'SOL_01_DICTAMEN_PREAUTORIZACION',
    'SOL_02_CLG_RPP',
    'SOL_03_DICTAMEN_CORPORATIVO',
    'SOL_04_DICTAMEN_GARANTIAS',
    'SOL_05_AVALUO',
    'SOL_06_RATIFICACION_CONTINUIDAD',
    'SOL_07_CONTRATO_ESCRITURA',
    'SOL_08_PROGRAMACION_FIRMA'
);


ALTER TYPE public."TipoSolicitud" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: BloqueOperacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BloqueOperacion" (
    id text NOT NULL,
    "operacionId" text NOT NULL,
    "numeroBloque" integer NOT NULL,
    status public."StatusBloque" DEFAULT 'PENDIENTE'::public."StatusBloque" NOT NULL,
    resultado public."StatusBloque",
    condiciones text,
    "motivoRechazo" text,
    "fechaInicio" timestamp(3) without time zone,
    "fechaCierre" timestamp(3) without time zone,
    "slaHoras" integer,
    "responsableId" text,
    "creadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "actualizadoEn" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."BloqueOperacion" OWNER TO postgres;

--
-- Name: ChecklistItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ChecklistItem" (
    id text NOT NULL,
    "bloqueId" text NOT NULL,
    descripcion text NOT NULL,
    categoria text,
    completado boolean DEFAULT false NOT NULL,
    "completadoPorId" text,
    "fechaCompletado" timestamp(3) without time zone,
    nota text,
    orden integer DEFAULT 0 NOT NULL,
    "creadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ChecklistItem" OWNER TO postgres;

--
-- Name: ComentarioSolicitud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ComentarioSolicitud" (
    id text NOT NULL,
    "solicitudId" text NOT NULL,
    "usuarioId" text NOT NULL,
    texto text NOT NULL,
    "archivoUrl" text,
    "creadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ComentarioSolicitud" OWNER TO postgres;

--
-- Name: Documento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Documento" (
    id text NOT NULL,
    "operacionId" text NOT NULL,
    nombre text NOT NULL,
    tamano integer,
    "creadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "actualizadoEn" timestamp(3) without time zone NOT NULL,
    "archivoUrl" text,
    "bloqueNumero" integer,
    "cargadoPorId" text,
    "fechaCarga" timestamp(3) without time zone,
    "fechaValidacion" timestamp(3) without time zone,
    nota text,
    seccion text NOT NULL,
    status public."StatusDocumento" DEFAULT 'PENDIENTE'::public."StatusDocumento" NOT NULL,
    "validadoPorId" text,
    tipo public."TipoDocumento" NOT NULL
);


ALTER TABLE public."Documento" OWNER TO postgres;

--
-- Name: HistorialMovimiento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."HistorialMovimiento" (
    id text NOT NULL,
    "operacionId" text NOT NULL,
    "usuarioId" text NOT NULL,
    tipo public."TipoHistorial" NOT NULL,
    descripcion text NOT NULL,
    detalle text,
    "creadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."HistorialMovimiento" OWNER TO postgres;

--
-- Name: Inversionista; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Inversionista" (
    id text NOT NULL,
    nombre text NOT NULL,
    "creadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "esSofom" boolean DEFAULT false NOT NULL,
    monto double precision NOT NULL,
    "operacionId" text NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    porcentaje double precision NOT NULL,
    "tasaNeta" double precision NOT NULL
);


ALTER TABLE public."Inversionista" OWNER TO postgres;

--
-- Name: Notificacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Notificacion" (
    id text NOT NULL,
    "usuarioId" text NOT NULL,
    tipo public."TipoNotificacion" NOT NULL,
    titulo text NOT NULL,
    descripcion text NOT NULL,
    "operacionId" text,
    "solicitudId" text,
    leida boolean DEFAULT false NOT NULL,
    "creadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Notificacion" OWNER TO postgres;

--
-- Name: Operacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Operacion" (
    id text NOT NULL,
    folio text NOT NULL,
    monto double precision NOT NULL,
    "tasaAnual" double precision NOT NULL,
    "plazoMeses" integer NOT NULL,
    "comisionApertura" double precision DEFAULT 0.03 NOT NULL,
    "spreadSofom" double precision,
    "adminFideicomiso" double precision,
    "comisionCobranza" double precision,
    status public."StatusOp" DEFAULT 'PROSPECTO'::public."StatusOp" NOT NULL,
    "folioPld" text,
    "valorInmueble" double precision,
    ltv double precision,
    notas text,
    "creadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "actualizadoEn" timestamp(3) without time zone NOT NULL,
    "acreditadoDireccion" text,
    "acreditadoEmail" text,
    "acreditadoNombre" text NOT NULL,
    "acreditadoRfc" text,
    "acreditadoTelefono" text,
    "acreditadoTipo" public."TipoAcreditado" DEFAULT 'PF'::public."TipoAcreditado" NOT NULL,
    "bloqueActual" integer DEFAULT 1 NOT NULL,
    "costosFijos" double precision DEFAULT 0 NOT NULL,
    "creadoPorId" text NOT NULL,
    "ejecutivoId" text NOT NULL,
    "fechaPrimerPago" timestamp(3) without time zone NOT NULL,
    nombre text NOT NULL,
    producto public."Producto" NOT NULL,
    "sofomComoAcreditante" boolean DEFAULT false NOT NULL,
    "sofomMonto" double precision,
    "sofomTasaNeta" double precision
);


ALTER TABLE public."Operacion" OWNER TO postgres;

--
-- Name: PagoMensual; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PagoMensual" (
    id text NOT NULL,
    "operacionId" text NOT NULL,
    "numeroPago" integer NOT NULL,
    "fechaVencimiento" timestamp(3) without time zone NOT NULL,
    "capitalTotal" double precision NOT NULL,
    "interesTotal" double precision NOT NULL,
    "pagoTotal" double precision NOT NULL,
    saldo double precision NOT NULL,
    status public."StatusPago" DEFAULT 'PENDIENTE'::public."StatusPago" NOT NULL,
    "montoPagado" double precision,
    notas text,
    "creadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "actualizadoEn" timestamp(3) without time zone NOT NULL,
    "comprobanteUrl" text,
    "condonadoPor" text,
    "diasMora" integer,
    "fechaPagoReal" timestamp(3) without time zone,
    "interesOrdinarioPagado" double precision,
    "intereseMoratorio" double precision,
    "montoOriginal" double precision,
    "motivoCondonacion" text,
    "registradoPorId" text
);


ALTER TABLE public."PagoMensual" OWNER TO postgres;

--
-- Name: Solicitud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Solicitud" (
    id text NOT NULL,
    folio text NOT NULL,
    "operacionId" text NOT NULL,
    tipo public."TipoSolicitud" NOT NULL,
    descripcion text,
    status public."StatusSolicitud" DEFAULT 'PENDIENTE'::public."StatusSolicitud" NOT NULL,
    "fechaLimite" timestamp(3) without time zone,
    "fechaCompletada" timestamp(3) without time zone,
    "bloqueNumero" integer,
    "generadaPorId" text NOT NULL,
    "dirigidaAId" text NOT NULL,
    "creadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "actualizadoEn" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Solicitud" OWNER TO postgres;

--
-- Name: Usuario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Usuario" (
    id text NOT NULL,
    nombre text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    rol public."Rol" DEFAULT 'OPERADOR'::public."Rol" NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    "creadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Usuario" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: BloqueOperacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BloqueOperacion" (id, "operacionId", "numeroBloque", status, resultado, condiciones, "motivoRechazo", "fechaInicio", "fechaCierre", "slaHoras", "responsableId", "creadoEn", "actualizadoEn") FROM stdin;
cmo1t5es70008nag87vor4y4x	cmo1t5es60004nag84ljskd44	1	CERRADO	PRE_AUTORIZADO	\N	\N	2026-04-01 00:00:00	2026-04-03 00:00:00	72	\N	2026-04-16 18:23:33.653	2026-04-16 18:23:33.653
cmo1t5es7000gnag8iic75gk5	cmo1t5es60004nag84ljskd44	2	EN_PROCESO	\N	\N	\N	2026-04-04 00:00:00	\N	\N	\N	2026-04-16 18:23:33.653	2026-04-16 18:23:33.653
cmo1t5es7000mnag8xiblp8l5	cmo1t5es60004nag84ljskd44	3	PENDIENTE	\N	\N	\N	\N	\N	72	\N	2026-04-16 18:23:33.653	2026-04-16 18:23:33.653
cmo1t5es8000unag8cxber0l8	cmo1t5es60004nag84ljskd44	4	PENDIENTE	\N	\N	\N	\N	\N	\N	\N	2026-04-16 18:23:33.653	2026-04-16 18:23:33.653
cmo1t5es80010nag869j7xvlg	cmo1t5es60004nag84ljskd44	5	PENDIENTE	\N	\N	\N	\N	\N	\N	\N	2026-04-16 18:23:33.653	2026-04-16 18:23:33.653
cmo1u9jud0002na9gnvxqcx3y	cmo1u9jud0001na9g8hs3y6ci	1	EN_PROCESO	\N	\N	\N	\N	\N	72	\N	2026-04-16 18:54:46.453	2026-04-16 18:54:46.453
cmo1u9jud000ana9gdppn7ury	cmo1u9jud0001na9g8hs3y6ci	2	PENDIENTE	\N	\N	\N	\N	\N	\N	\N	2026-04-16 18:54:46.453	2026-04-16 18:54:46.453
cmo1u9jud000gna9gldsxbfhp	cmo1u9jud0001na9g8hs3y6ci	3	PENDIENTE	\N	\N	\N	\N	\N	72	\N	2026-04-16 18:54:46.453	2026-04-16 18:54:46.453
cmo1u9jud000ona9gydv7orre	cmo1u9jud0001na9g8hs3y6ci	4	PENDIENTE	\N	\N	\N	\N	\N	\N	\N	2026-04-16 18:54:46.453	2026-04-16 18:54:46.453
cmo1u9jud000una9gfehld8th	cmo1u9jud0001na9g8hs3y6ci	5	PENDIENTE	\N	\N	\N	\N	\N	\N	\N	2026-04-16 18:54:46.453	2026-04-16 18:54:46.453
\.


--
-- Data for Name: ChecklistItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ChecklistItem" (id, "bloqueId", descripcion, categoria, completado, "completadoPorId", "fechaCompletado", nota, orden, "creadoEn") FROM stdin;
cmo1t5es70009nag8g335d3y0	cmo1t5es70008nag87vor4y4x	Análisis de buró de crédito — carga financiera	RIESGOS	t	\N	\N	\N	0	2026-04-16 18:23:33.653
cmo1t5es7000anag891gvtnm3	cmo1t5es70008nag87vor4y4x	Análisis de estados financieros — estructura de la empresa	RIESGOS	t	\N	\N	\N	1	2026-04-16 18:23:33.653
cmo1t5es7000bnag8x71b5ak0	cmo1t5es70008nag87vor4y4x	Comportamiento del ingreso bancario (estado de cuenta depurado)	RIESGOS	t	\N	\N	\N	2	2026-04-16 18:23:33.653
cmo1t5es7000cnag8567cbp1t	cmo1t5es70008nag87vor4y4x	Coherencia fiscal vs. ingresos	RIESGOS	t	\N	\N	\N	3	2026-04-16 18:23:33.653
cmo1t5es7000dnag8srqfgizk	cmo1t5es70008nag87vor4y4x	Análisis integral de capacidad de pago vs. carga financiera	RIESGOS	t	\N	\N	\N	4	2026-04-16 18:23:33.653
cmo1t5es7000enag8lapy9bpm	cmo1t5es70008nag87vor4y4x	Viabilidad preliminar de garantía	RIESGOS	t	\N	\N	\N	5	2026-04-16 18:23:33.653
cmo1t5es7000fnag8ftbj776m	cmo1t5es70008nag87vor4y4x	Perfil de la operación (estructura, avales, condiciones)	RIESGOS	t	\N	\N	\N	6	2026-04-16 18:23:33.653
cmo1t5es7000hnag80zqeqszg	cmo1t5es7000gnag8iic75gk5	Integración documental completa	COMERCIAL	t	\N	\N	\N	0	2026-04-16 18:23:33.653
cmo1t5es7000inag8l0zw2de4	cmo1t5es7000gnag8iic75gk5	Validación de documentos (cotejo)	COMERCIAL	f	\N	\N	\N	1	2026-04-16 18:23:33.653
cmo1t5es7000jnag8dv519q0b	cmo1t5es7000gnag8iic75gk5	Sellos y firmas de cotejo en el expediente	COMERCIAL	f	\N	\N	\N	2	2026-04-16 18:23:33.653
cmo1t5es7000knag8mhufylq5	cmo1t5es7000gnag8iic75gk5	Verificación de domicilio	COMERCIAL	f	\N	\N	\N	3	2026-04-16 18:23:33.653
cmo1t5es7000lnag8ebiq5nwm	cmo1t5es7000gnag8iic75gk5	Solicitud CLG ante RPP o solicitud directa al cliente	COMERCIAL	f	\N	\N	\N	4	2026-04-16 18:23:33.653
cmo1t5es7000nnag88goxb0py	cmo1t5es7000mnag8xiblp8l5	Validación societaria (SIGER) — PM	JURIDICO	f	\N	\N	\N	0	2026-04-16 18:23:33.653
cmo1t5es7000onag81d8qv8zt	cmo1t5es7000mnag8xiblp8l5	Dictamen corporativo	JURIDICO	f	\N	\N	\N	1	2026-04-16 18:23:33.653
cmo1t5es7000pnag8ebm4jpgs	cmo1t5es7000mnag8xiblp8l5	Consultas legales de intervinientes (PF y PM)	JURIDICO	f	\N	\N	\N	2	2026-04-16 18:23:33.653
cmo1t5es7000qnag8v3ojma2a	cmo1t5es7000mnag8xiblp8l5	Dictamen de garantías — inmueble / prenda	JURIDICO	f	\N	\N	\N	3	2026-04-16 18:23:33.653
cmo1t5es7000rnag8namf3eij	cmo1t5es7000mnag8xiblp8l5	Validación CLG (garantías hipotecarias) o RUG + sellos (prendarias)	JURIDICO	f	\N	\N	\N	4	2026-04-16 18:23:33.653
cmo1t5es7000snag8tva03p0o	cmo1t5es7000mnag8xiblp8l5	Validación de garantes	JURIDICO	f	\N	\N	\N	5	2026-04-16 18:23:33.653
cmo1t5es7000tnag8cw0up5xy	cmo1t5es7000mnag8xiblp8l5	Validación de avales	JURIDICO	f	\N	\N	\N	6	2026-04-16 18:23:33.653
cmo1t5es8000vnag8gw8izz0o	cmo1t5es8000unag8cxber0l8	Entrega de solicitud	COMERCIAL	f	\N	\N	\N	0	2026-04-16 18:23:33.653
cmo1t5es8000wnag8s2cfn8lt	cmo1t5es8000unag8cxber0l8	Entrega de reporte de visita	COMERCIAL	f	\N	\N	\N	1	2026-04-16 18:23:33.653
cmo1t5es8000xnag8qaoo5duo	cmo1t5es8000unag8cxber0l8	Entrega de reporte cualitativo del Área Comercial	COMERCIAL	f	\N	\N	\N	2	2026-04-16 18:23:33.653
cmo1t5es8000ynag8jntl9abb	cmo1t5es8000unag8cxber0l8	Revisión final del expediente debidamente integrado	RIESGOS	f	\N	\N	\N	3	2026-04-16 18:23:33.653
cmo1t5es8000znag8x4rmek12	cmo1t5es8000unag8cxber0l8	Solicitud de avalúo	RIESGOS	f	\N	\N	\N	4	2026-04-16 18:23:33.653
cmo1t5es80011nag8va1dl6uz	cmo1t5es80010nag869j7xvlg	Recepción del avalúo final	RIESGOS	f	\N	\N	\N	0	2026-04-16 18:23:33.653
cmo1t5es80012nag87nq3jlx3	cmo1t5es80010nag869j7xvlg	Reporte cualitativo del Área de Crédito	RIESGOS	f	\N	\N	\N	1	2026-04-16 18:23:33.653
cmo1t5es80013nag82hycqv60	cmo1t5es80010nag869j7xvlg	Determinación del aforo de garantías definitivo — Comité de Crédito	RIESGOS	f	\N	\N	\N	2	2026-04-16 18:23:33.653
cmo1t5es80014nag8coainref	cmo1t5es80010nag869j7xvlg	Ratificación del monto del crédito — Comité de Crédito	RIESGOS	f	\N	\N	\N	3	2026-04-16 18:23:33.653
cmo1t5es80015nag8yf66trse	cmo1t5es80010nag869j7xvlg	Carga del crédito en sistema	RIESGOS	f	\N	\N	\N	4	2026-04-16 18:23:33.653
cmo1t5es80016nag8geugkn6t	cmo1t5es80010nag869j7xvlg	Dispersión del crédito realizada	RIESGOS	f	\N	\N	\N	5	2026-04-16 18:23:33.653
cmo1t5es80017nag8bbjzlt6f	cmo1t5es80010nag869j7xvlg	Elaboración del contrato de crédito	JURIDICO	f	\N	\N	\N	6	2026-04-16 18:23:33.653
cmo1t5es80018nag83st9ynf9	cmo1t5es80010nag869j7xvlg	Elaboración de la escritura de fideicomiso de garantía	JURIDICO	f	\N	\N	\N	7	2026-04-16 18:23:33.653
cmo1t5es80019nag82g89xfrc	cmo1t5es80010nag869j7xvlg	Elaboración de convenios de participación por inversionista	JURIDICO	f	\N	\N	\N	8	2026-04-16 18:23:33.653
cmo1t5es8001anag88rvj4flb	cmo1t5es80010nag869j7xvlg	Programación de fecha de firma	JURIDICO	f	\N	\N	\N	9	2026-04-16 18:23:33.653
cmo1t5es8001bnag8c322jqdw	cmo1t5es80010nag869j7xvlg	Firma realizada	JURIDICO	f	\N	\N	\N	10	2026-04-16 18:23:33.653
cmo1u9jud0003na9gblzxfh1n	cmo1u9jud0002na9gnvxqcx3y	Análisis de buró de crédito — carga financiera	RIESGOS	f	\N	\N	\N	0	2026-04-16 18:54:46.453
cmo1u9jud0004na9g9d62sgkw	cmo1u9jud0002na9gnvxqcx3y	Análisis de estados financieros — estructura de la empresa	RIESGOS	f	\N	\N	\N	1	2026-04-16 18:54:46.453
cmo1u9jud0005na9gonx8d61u	cmo1u9jud0002na9gnvxqcx3y	Comportamiento del ingreso bancario (estado de cuenta depurado)	RIESGOS	f	\N	\N	\N	2	2026-04-16 18:54:46.453
cmo1u9jud0006na9gsa65wum7	cmo1u9jud0002na9gnvxqcx3y	Coherencia fiscal vs. ingresos	RIESGOS	f	\N	\N	\N	3	2026-04-16 18:54:46.453
cmo1u9jud0007na9guolgcgvd	cmo1u9jud0002na9gnvxqcx3y	Análisis integral de capacidad de pago vs. carga financiera	RIESGOS	f	\N	\N	\N	4	2026-04-16 18:54:46.453
cmo1u9jud0008na9g540fq5ve	cmo1u9jud0002na9gnvxqcx3y	Viabilidad preliminar de garantía	RIESGOS	f	\N	\N	\N	5	2026-04-16 18:54:46.453
cmo1u9jud0009na9gfremixee	cmo1u9jud0002na9gnvxqcx3y	Perfil de la operación (estructura, avales, condiciones)	RIESGOS	f	\N	\N	\N	6	2026-04-16 18:54:46.453
cmo1u9jud000bna9g7bc7ra53	cmo1u9jud000ana9gdppn7ury	Integración documental completa	COMERCIAL	f	\N	\N	\N	0	2026-04-16 18:54:46.453
cmo1u9jud000cna9g4ot49q37	cmo1u9jud000ana9gdppn7ury	Validación de documentos (cotejo)	COMERCIAL	f	\N	\N	\N	1	2026-04-16 18:54:46.453
cmo1u9jud000dna9g5wtrdwmz	cmo1u9jud000ana9gdppn7ury	Sellos y firmas de cotejo en el expediente	COMERCIAL	f	\N	\N	\N	2	2026-04-16 18:54:46.453
cmo1u9jud000ena9g4k1mfhos	cmo1u9jud000ana9gdppn7ury	Verificación de domicilio	COMERCIAL	f	\N	\N	\N	3	2026-04-16 18:54:46.453
cmo1u9jud000fna9gnqpvtxck	cmo1u9jud000ana9gdppn7ury	Solicitud CLG ante RPP o solicitud directa al cliente	COMERCIAL	f	\N	\N	\N	4	2026-04-16 18:54:46.453
cmo1u9jud000hna9g92x6329g	cmo1u9jud000gna9gldsxbfhp	Validación societaria (SIGER) — PM	JURIDICO	f	\N	\N	\N	0	2026-04-16 18:54:46.453
cmo1u9jud000ina9g1703x885	cmo1u9jud000gna9gldsxbfhp	Dictamen corporativo	JURIDICO	f	\N	\N	\N	1	2026-04-16 18:54:46.453
cmo1u9jud000jna9g99f5gbvm	cmo1u9jud000gna9gldsxbfhp	Consultas legales de intervinientes (PF y PM)	JURIDICO	f	\N	\N	\N	2	2026-04-16 18:54:46.453
cmo1u9jud000kna9ghc4ysjyl	cmo1u9jud000gna9gldsxbfhp	Dictamen de garantías — inmueble / prenda	JURIDICO	f	\N	\N	\N	3	2026-04-16 18:54:46.453
cmo1u9jud000lna9gua5gegt7	cmo1u9jud000gna9gldsxbfhp	Validación CLG (garantías hipotecarias) o RUG + sellos (prendarias)	JURIDICO	f	\N	\N	\N	4	2026-04-16 18:54:46.453
cmo1u9jud000mna9gm8uwv334	cmo1u9jud000gna9gldsxbfhp	Validación de garantes	JURIDICO	f	\N	\N	\N	5	2026-04-16 18:54:46.453
cmo1u9jud000nna9gr90zb6wh	cmo1u9jud000gna9gldsxbfhp	Validación de avales	JURIDICO	f	\N	\N	\N	6	2026-04-16 18:54:46.453
cmo1u9jud000pna9gm709c2d1	cmo1u9jud000ona9gydv7orre	Entrega de solicitud	COMERCIAL	f	\N	\N	\N	0	2026-04-16 18:54:46.453
cmo1u9jud000qna9g38zmouzd	cmo1u9jud000ona9gydv7orre	Entrega de reporte de visita	COMERCIAL	f	\N	\N	\N	1	2026-04-16 18:54:46.453
cmo1u9jud000rna9gxmc8869p	cmo1u9jud000ona9gydv7orre	Entrega de reporte cualitativo del Área Comercial	COMERCIAL	f	\N	\N	\N	2	2026-04-16 18:54:46.453
cmo1u9jud000sna9g2umenk27	cmo1u9jud000ona9gydv7orre	Revisión final del expediente debidamente integrado	RIESGOS	f	\N	\N	\N	3	2026-04-16 18:54:46.453
cmo1u9jud000tna9g8p3pd5gy	cmo1u9jud000ona9gydv7orre	Solicitud de avalúo	RIESGOS	f	\N	\N	\N	4	2026-04-16 18:54:46.453
cmo1u9jue000vna9g28z7aeyw	cmo1u9jud000una9gfehld8th	Recepción del avalúo final	RIESGOS	f	\N	\N	\N	0	2026-04-16 18:54:46.453
cmo1u9jue000wna9gh3phh1am	cmo1u9jud000una9gfehld8th	Reporte cualitativo del Área de Crédito	RIESGOS	f	\N	\N	\N	1	2026-04-16 18:54:46.453
cmo1u9jue000xna9gxefenyim	cmo1u9jud000una9gfehld8th	Determinación del aforo de garantías definitivo — Comité de Crédito	RIESGOS	f	\N	\N	\N	2	2026-04-16 18:54:46.453
cmo1u9jue000yna9gq9x71hh1	cmo1u9jud000una9gfehld8th	Ratificación del monto del crédito — Comité de Crédito	RIESGOS	f	\N	\N	\N	3	2026-04-16 18:54:46.453
cmo1u9jue000zna9g58d78fir	cmo1u9jud000una9gfehld8th	Carga del crédito en sistema	RIESGOS	f	\N	\N	\N	4	2026-04-16 18:54:46.453
cmo1u9jue0010na9gohqw5vam	cmo1u9jud000una9gfehld8th	Dispersión del crédito realizada	RIESGOS	f	\N	\N	\N	5	2026-04-16 18:54:46.453
cmo1u9jue0011na9g3t9d52mz	cmo1u9jud000una9gfehld8th	Elaboración del contrato de crédito	JURIDICO	f	\N	\N	\N	6	2026-04-16 18:54:46.453
cmo1u9jue0012na9gxmbz3l7f	cmo1u9jud000una9gfehld8th	Revisión de garantías	JURIDICO	f	\N	\N	\N	7	2026-04-16 18:54:46.453
cmo1u9jue0013na9gvmqnq2ur	cmo1u9jud000una9gfehld8th	Documentación complementaria	JURIDICO	f	\N	\N	\N	8	2026-04-16 18:54:46.453
cmo1u9jue0014na9g40aeh7yl	cmo1u9jud000una9gfehld8th	Programación de fecha de firma	JURIDICO	f	\N	\N	\N	9	2026-04-16 18:54:46.453
cmo1u9jue0015na9gccwo2e22	cmo1u9jud000una9gfehld8th	Firma realizada	JURIDICO	f	\N	\N	\N	10	2026-04-16 18:54:46.453
\.


--
-- Data for Name: ComentarioSolicitud; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ComentarioSolicitud" (id, "solicitudId", "usuarioId", texto, "archivoUrl", "creadoEn") FROM stdin;
\.


--
-- Data for Name: Documento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Documento" (id, "operacionId", nombre, tamano, "creadoEn", "actualizadoEn", "archivoUrl", "bloqueNumero", "cargadoPorId", "fechaCarga", "fechaValidacion", nota, seccion, status, "validadoPorId", tipo) FROM stdin;
\.


--
-- Data for Name: HistorialMovimiento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."HistorialMovimiento" (id, "operacionId", "usuarioId", tipo, descripcion, detalle, "creadoEn") FROM stdin;
cmo1t5et5002cnag8wqzm5dji	cmo1t5es60004nag84ljskd44	cmo1radtk0000nahs9rardl4u	CREACION	Operación INY-SEED-001 creada	Producto: STPB | Monto: $3,500,000 | Plazo: 36 meses	2026-04-01 15:00:00
cmo1t5et5002dnag8od4cnjo9	cmo1t5es60004nag84ljskd44	cmo1rbaj60002na2c8hw15d4d	AVANCE_BLOQUE	Avance de Bloque 1 → Bloque 2	\N	2026-04-03 23:30:00
cmo1u9jyx001jna9g469kx22x	cmo1u9jud0001na9g8hs3y6ci	cmo1radtk0000nahs9rardl4u	CREACION	Operación INY-2604-SUS0 creada	Producto: PERSONAL | Monto: $500,000 | Plazo: 12 meses	2026-04-16 18:54:46.618
\.


--
-- Data for Name: Inversionista; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Inversionista" (id, nombre, "creadoEn", "esSofom", monto, "operacionId", orden, porcentaje, "tasaNeta") FROM stdin;
cmo1t5es60005nag898fxsc1z	Grupo Financiero Lomas S.A.	2026-04-16 18:23:33.653	f	1750000	cmo1t5es60004nag84ljskd44	0	0.5	0.14
cmo1t5es60006nag8h3o62qk2	Inversiones Sierra Vista S.C.	2026-04-16 18:23:33.653	f	1250000	cmo1t5es60004nag84ljskd44	1	0.3571	0.13
cmo1t5es60007nag8426rj7tb	SOFOM Inyecta (participación propia)	2026-04-16 18:23:33.653	t	500000	cmo1t5es60004nag84ljskd44	2	0.1429	0.14
\.


--
-- Data for Name: Notificacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Notificacion" (id, "usuarioId", tipo, titulo, descripcion, "operacionId", "solicitudId", leida, "creadoEn") FROM stdin;
\.


--
-- Data for Name: Operacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Operacion" (id, folio, monto, "tasaAnual", "plazoMeses", "comisionApertura", "spreadSofom", "adminFideicomiso", "comisionCobranza", status, "folioPld", "valorInmueble", ltv, notas, "creadoEn", "actualizadoEn", "acreditadoDireccion", "acreditadoEmail", "acreditadoNombre", "acreditadoRfc", "acreditadoTelefono", "acreditadoTipo", "bloqueActual", "costosFijos", "creadoPorId", "ejecutivoId", "fechaPrimerPago", nombre, producto, "sofomComoAcreditante", "sofomMonto", "sofomTasaNeta") FROM stdin;
cmo1t5es60004nag84ljskd44	INY-SEED-001	3500000	0.18	36	0.03	0.04	0.015	0.005	ANALISIS	\N	5800000	0.603448275862069	Operación de muestra generada por seed	2026-04-16 18:23:33.653	2026-04-16 18:23:33.653	Av. Carranza 1500, Col. Centro, SLP	contacto@dicsa.mx	Desarrollos Inmobiliarios del Centro S.A.	DIC200101ABC	444-123-4567	PM	2	0	cmo1radtk0000nahs9rardl4u	cmo1rbaj60002na2c8hw15d4d	2026-06-01 18:00:00	Crédito Hipotecario STPB — Desarrollos del Centro	STPB	t	500000	0.14
cmo1u9jud0001na9g8hs3y6ci	INY-2604-SUS0	500000	0.24	12	0.03	0.04	0.015	0.005	PROSPECTO	\N	\N	\N	\N	2026-04-16 18:54:46.453	2026-04-16 18:54:46.453	\N	\N	Maria Garcia	GALM850101	\N	PF	1	0	cmo1radtk0000nahs9rardl4u	cmo1radtk0000nahs9rardl4u	2026-05-01 00:00:00	Test PF	PERSONAL	f	\N	\N
\.


--
-- Data for Name: PagoMensual; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PagoMensual" (id, "operacionId", "numeroPago", "fechaVencimiento", "capitalTotal", "interesTotal", "pagoTotal", saldo, status, "montoPagado", notas, "creadoEn", "actualizadoEn", "comprobanteUrl", "condonadoPor", "diasMora", "fechaPagoReal", "interesOrdinarioPagado", "intereseMoratorio", "montoOriginal", "motivoCondonacion", "registradoPorId") FROM stdin;
cmo1t5esw001cnag8784frq6t	cmo1t5es60004nag84ljskd44	1	2026-06-01 18:00:00	74033.38	52500	126533.38	3425966.62	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esw001dnag8wtspxnqy	cmo1t5es60004nag84ljskd44	2	2026-07-01 18:00:00	75143.89	51389.5	126533.38	3350822.73	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esw001enag8mwggci8g	cmo1t5es60004nag84ljskd44	3	2026-08-01 18:00:00	76271.04	50262.34	126533.38	3274551.69	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esw001fnag8ugog88w4	cmo1t5es60004nag84ljskd44	4	2026-09-01 18:00:00	77415.11	49118.28	126533.38	3197136.58	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esw001gnag8nildhuwh	cmo1t5es60004nag84ljskd44	5	2026-10-01 18:00:00	78576.34	47957.05	126533.38	3118560.24	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esw001hnag8yjhkseqq	cmo1t5es60004nag84ljskd44	6	2026-11-01 18:00:00	79754.98	46778.4	126533.38	3038805.26	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esw001inag8lwcsvap0	cmo1t5es60004nag84ljskd44	7	2026-12-01 18:00:00	80951.31	45582.08	126533.38	2957853.96	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esw001jnag8ecmzh8k1	cmo1t5es60004nag84ljskd44	8	2027-01-01 18:00:00	82165.58	44367.81	126533.38	2875688.38	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esw001knag8t6wl2el8	cmo1t5es60004nag84ljskd44	9	2027-02-01 18:00:00	83398.06	43135.33	126533.38	2792290.32	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esw001lnag882l3q2mo	cmo1t5es60004nag84ljskd44	10	2027-03-01 18:00:00	84649.03	41884.35	126533.38	2707641.29	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esw001mnag8ou80gk57	cmo1t5es60004nag84ljskd44	11	2027-04-01 18:00:00	85918.76	40614.62	126533.38	2621722.53	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esw001nnag8di6i2ao3	cmo1t5es60004nag84ljskd44	12	2027-05-01 18:00:00	87207.55	39325.84	126533.38	2534514.98	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esw001onag8ph7lm1kn	cmo1t5es60004nag84ljskd44	13	2027-06-01 18:00:00	88515.66	38017.72	126533.38	2445999.32	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esw001pnag8x5ec5yvx	cmo1t5es60004nag84ljskd44	14	2027-07-01 18:00:00	89843.39	36689.99	126533.38	2356155.93	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esw001qnag8whts0xn8	cmo1t5es60004nag84ljskd44	15	2027-08-01 18:00:00	91191.05	35342.34	126533.38	2264964.88	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esx001rnag81a339egy	cmo1t5es60004nag84ljskd44	16	2027-09-01 18:00:00	92558.91	33974.47	126533.38	2172405.97	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esx001snag8ome0g7uo	cmo1t5es60004nag84ljskd44	17	2027-10-01 18:00:00	93947.29	32586.09	126533.38	2078458.68	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esx001tnag81wt1l43q	cmo1t5es60004nag84ljskd44	18	2027-11-01 18:00:00	95356.5	31176.88	126533.38	1983102.17	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esx001unag8y1uidf8x	cmo1t5es60004nag84ljskd44	19	2027-12-01 18:00:00	96786.85	29746.53	126533.38	1886315.32	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esx001vnag8yn8t4qdr	cmo1t5es60004nag84ljskd44	20	2028-01-01 18:00:00	98238.65	28294.73	126533.38	1788076.67	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esx001wnag80xbpd51u	cmo1t5es60004nag84ljskd44	21	2028-02-01 18:00:00	99712.23	26821.15	126533.38	1688364.43	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esx001xnag8ix92y3pe	cmo1t5es60004nag84ljskd44	22	2028-03-01 18:00:00	101207.92	25325.47	126533.38	1587156.51	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esx001ynag8ye4xp7sy	cmo1t5es60004nag84ljskd44	23	2028-04-01 18:00:00	102726.04	23807.35	126533.38	1484430.48	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esx001znag848owrzmo	cmo1t5es60004nag84ljskd44	24	2028-05-01 18:00:00	104266.93	22266.46	126533.38	1380163.55	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esx0020nag8rtorpah6	cmo1t5es60004nag84ljskd44	25	2028-06-01 18:00:00	105830.93	20702.45	126533.38	1274332.62	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esx0021nag81ade6nfd	cmo1t5es60004nag84ljskd44	26	2028-07-01 18:00:00	107418.4	19114.99	126533.38	1166914.22	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esx0022nag8gajbij9s	cmo1t5es60004nag84ljskd44	27	2028-08-01 18:00:00	109029.67	17503.71	126533.38	1057884.55	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esx0023nag8r5e0gr62	cmo1t5es60004nag84ljskd44	28	2028-09-01 18:00:00	110665.12	15868.27	126533.38	947219.44	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esx0024nag8cbzv3pf5	cmo1t5es60004nag84ljskd44	29	2028-10-01 18:00:00	112325.09	14208.29	126533.38	834894.34	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esx0025nag8sc5yinjv	cmo1t5es60004nag84ljskd44	30	2028-11-01 18:00:00	114009.97	12523.42	126533.38	720884.37	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esx0026nag8f7x3icge	cmo1t5es60004nag84ljskd44	31	2028-12-01 18:00:00	115720.12	10813.27	126533.38	605164.25	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esx0027nag8slf35hoy	cmo1t5es60004nag84ljskd44	32	2029-01-01 18:00:00	117455.92	9077.46	126533.38	487708.33	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esx0028nag8x7ihx45j	cmo1t5es60004nag84ljskd44	33	2029-02-01 18:00:00	119217.76	7315.63	126533.38	368490.57	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esx0029nag8r0fd34jy	cmo1t5es60004nag84ljskd44	34	2029-03-01 18:00:00	121006.03	5527.36	126533.38	247484.55	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esx002anag8wgquy5my	cmo1t5es60004nag84ljskd44	35	2029-04-01 18:00:00	122821.12	3712.27	126533.38	124663.43	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1t5esx002bnag820gp6jd2	cmo1t5es60004nag84ljskd44	36	2029-05-01 18:00:00	124663.43	1869.95	126533.38	0	PENDIENTE	\N	\N	2026-04-16 18:23:33.68	2026-04-16 18:23:33.68	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1u9jw30016na9gffo5yecb	cmo1u9jud0001na9g8hs3y6ci	1	2026-04-30 06:00:00	37279.8	10000	47279.8	462720.2	PENDIENTE	\N	\N	2026-04-16 18:54:46.516	2026-04-16 18:54:46.516	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1u9jw30017na9gn4etmm7r	cmo1u9jud0001na9g8hs3y6ci	2	2026-05-30 06:00:00	38025.39	9254.4	47279.8	424694.81	PENDIENTE	\N	\N	2026-04-16 18:54:46.516	2026-04-16 18:54:46.516	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1u9jw40018na9gap8gdnfd	cmo1u9jud0001na9g8hs3y6ci	3	2026-06-30 06:00:00	38785.9	8493.9	47279.8	385908.91	PENDIENTE	\N	\N	2026-04-16 18:54:46.516	2026-04-16 18:54:46.516	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1u9jw40019na9goxsaexi2	cmo1u9jud0001na9g8hs3y6ci	4	2026-07-30 06:00:00	39561.62	7718.18	47279.8	346347.29	PENDIENTE	\N	\N	2026-04-16 18:54:46.516	2026-04-16 18:54:46.516	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1u9jw4001ana9gw1zghtm1	cmo1u9jud0001na9g8hs3y6ci	5	2026-08-30 06:00:00	40352.85	6926.95	47279.8	305994.43	PENDIENTE	\N	\N	2026-04-16 18:54:46.516	2026-04-16 18:54:46.516	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1u9jw4001bna9gxslt81dy	cmo1u9jud0001na9g8hs3y6ci	6	2026-09-30 06:00:00	41159.91	6119.89	47279.8	264834.52	PENDIENTE	\N	\N	2026-04-16 18:54:46.516	2026-04-16 18:54:46.516	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1u9jw4001cna9gdkj6hoqo	cmo1u9jud0001na9g8hs3y6ci	7	2026-10-30 06:00:00	41983.11	5296.69	47279.8	222851.41	PENDIENTE	\N	\N	2026-04-16 18:54:46.516	2026-04-16 18:54:46.516	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1u9jw4001dna9gbfa84r39	cmo1u9jud0001na9g8hs3y6ci	8	2026-11-30 06:00:00	42822.77	4457.03	47279.8	180028.64	PENDIENTE	\N	\N	2026-04-16 18:54:46.516	2026-04-16 18:54:46.516	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1u9jw4001ena9go52kfb0j	cmo1u9jud0001na9g8hs3y6ci	9	2026-12-30 06:00:00	43679.23	3600.57	47279.8	136349.42	PENDIENTE	\N	\N	2026-04-16 18:54:46.516	2026-04-16 18:54:46.516	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1u9jw4001fna9g77yiy9lt	cmo1u9jud0001na9g8hs3y6ci	10	2027-01-30 06:00:00	44552.81	2726.99	47279.8	91796.61	PENDIENTE	\N	\N	2026-04-16 18:54:46.516	2026-04-16 18:54:46.516	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1u9jw4001gna9gy775lb3k	cmo1u9jud0001na9g8hs3y6ci	11	2027-02-28 06:00:00	45443.87	1835.93	47279.8	46352.74	PENDIENTE	\N	\N	2026-04-16 18:54:46.516	2026-04-16 18:54:46.516	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmo1u9jw4001hna9g172fvtwo	cmo1u9jud0001na9g8hs3y6ci	12	2027-03-30 06:00:00	46352.74	927.05	47279.8	0	PENDIENTE	\N	\N	2026-04-16 18:54:46.516	2026-04-16 18:54:46.516	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: Solicitud; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Solicitud" (id, folio, "operacionId", tipo, descripcion, status, "fechaLimite", "fechaCompletada", "bloqueNumero", "generadaPorId", "dirigidaAId", "creadoEn", "actualizadoEn") FROM stdin;
\.


--
-- Data for Name: Usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Usuario" (id, nombre, email, password, rol, activo, "creadoEn") FROM stdin;
cmo1radtk0000nahs9rardl4u	Rubén Acevedo	ruben.acevedo03@inyecta.com.mx	$2a$12$qmHw2ZOxSNFA5uVrvKZPQeXsdxQ9qMNyREf2X02o2HDgomYNLtYoK	ADMIN	t	2026-04-16 17:31:26.456
cmo1rba6i0001na2cfuakn0sm	Legal Inyecta	juridico@inyecta.com.mx	$2a$12$pvs4IY2qj0ErHAOF0nPlbepd8cwl5PblRQplBSfi6zWtqNGYPW0D6	LEGAL	t	2026-04-16 17:32:08.394
cmo1rbaj60002na2c8hw15d4d	Operador Demo	operador@inyecta.com.mx	$2a$12$A/pwzH3Ag20aOqShl9imt.lkU9c.muVv5040Ef8Y2/nzLF8ywYsUy	OPERADOR	t	2026-04-16 17:32:08.851
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
d6255b51-c2fa-41d8-8a41-531b8f773bc4	6d611dbaa6ed02c6a6925fec08a0727cd66517c240c6be62571d3eb55ccd4bf9	2026-04-16 11:31:22.103085-06	20260416013014_init	\N	\N	2026-04-16 11:31:22.034677-06	1
\.


--
-- Name: BloqueOperacion BloqueOperacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BloqueOperacion"
    ADD CONSTRAINT "BloqueOperacion_pkey" PRIMARY KEY (id);


--
-- Name: ChecklistItem ChecklistItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChecklistItem"
    ADD CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY (id);


--
-- Name: ComentarioSolicitud ComentarioSolicitud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ComentarioSolicitud"
    ADD CONSTRAINT "ComentarioSolicitud_pkey" PRIMARY KEY (id);


--
-- Name: Documento Documento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Documento"
    ADD CONSTRAINT "Documento_pkey" PRIMARY KEY (id);


--
-- Name: HistorialMovimiento HistorialMovimiento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HistorialMovimiento"
    ADD CONSTRAINT "HistorialMovimiento_pkey" PRIMARY KEY (id);


--
-- Name: Inversionista Inversionista_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Inversionista"
    ADD CONSTRAINT "Inversionista_pkey" PRIMARY KEY (id);


--
-- Name: Notificacion Notificacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notificacion"
    ADD CONSTRAINT "Notificacion_pkey" PRIMARY KEY (id);


--
-- Name: Operacion Operacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Operacion"
    ADD CONSTRAINT "Operacion_pkey" PRIMARY KEY (id);


--
-- Name: PagoMensual PagoMensual_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PagoMensual"
    ADD CONSTRAINT "PagoMensual_pkey" PRIMARY KEY (id);


--
-- Name: Solicitud Solicitud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Solicitud"
    ADD CONSTRAINT "Solicitud_pkey" PRIMARY KEY (id);


--
-- Name: Usuario Usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Usuario"
    ADD CONSTRAINT "Usuario_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: BloqueOperacion_operacionId_numeroBloque_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "BloqueOperacion_operacionId_numeroBloque_key" ON public."BloqueOperacion" USING btree ("operacionId", "numeroBloque");


--
-- Name: Operacion_folio_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Operacion_folio_key" ON public."Operacion" USING btree (folio);


--
-- Name: Solicitud_folio_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Solicitud_folio_key" ON public."Solicitud" USING btree (folio);


--
-- Name: Usuario_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Usuario_email_key" ON public."Usuario" USING btree (email);


--
-- Name: BloqueOperacion BloqueOperacion_operacionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BloqueOperacion"
    ADD CONSTRAINT "BloqueOperacion_operacionId_fkey" FOREIGN KEY ("operacionId") REFERENCES public."Operacion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BloqueOperacion BloqueOperacion_responsableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BloqueOperacion"
    ADD CONSTRAINT "BloqueOperacion_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ChecklistItem ChecklistItem_bloqueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChecklistItem"
    ADD CONSTRAINT "ChecklistItem_bloqueId_fkey" FOREIGN KEY ("bloqueId") REFERENCES public."BloqueOperacion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChecklistItem ChecklistItem_completadoPorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChecklistItem"
    ADD CONSTRAINT "ChecklistItem_completadoPorId_fkey" FOREIGN KEY ("completadoPorId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ComentarioSolicitud ComentarioSolicitud_solicitudId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ComentarioSolicitud"
    ADD CONSTRAINT "ComentarioSolicitud_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES public."Solicitud"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ComentarioSolicitud ComentarioSolicitud_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ComentarioSolicitud"
    ADD CONSTRAINT "ComentarioSolicitud_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Documento Documento_cargadoPorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Documento"
    ADD CONSTRAINT "Documento_cargadoPorId_fkey" FOREIGN KEY ("cargadoPorId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Documento Documento_operacionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Documento"
    ADD CONSTRAINT "Documento_operacionId_fkey" FOREIGN KEY ("operacionId") REFERENCES public."Operacion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Documento Documento_validadoPorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Documento"
    ADD CONSTRAINT "Documento_validadoPorId_fkey" FOREIGN KEY ("validadoPorId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: HistorialMovimiento HistorialMovimiento_operacionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HistorialMovimiento"
    ADD CONSTRAINT "HistorialMovimiento_operacionId_fkey" FOREIGN KEY ("operacionId") REFERENCES public."Operacion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: HistorialMovimiento HistorialMovimiento_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HistorialMovimiento"
    ADD CONSTRAINT "HistorialMovimiento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Inversionista Inversionista_operacionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Inversionista"
    ADD CONSTRAINT "Inversionista_operacionId_fkey" FOREIGN KEY ("operacionId") REFERENCES public."Operacion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Notificacion Notificacion_operacionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notificacion"
    ADD CONSTRAINT "Notificacion_operacionId_fkey" FOREIGN KEY ("operacionId") REFERENCES public."Operacion"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Notificacion Notificacion_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notificacion"
    ADD CONSTRAINT "Notificacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Operacion Operacion_creadoPorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Operacion"
    ADD CONSTRAINT "Operacion_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Operacion Operacion_ejecutivoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Operacion"
    ADD CONSTRAINT "Operacion_ejecutivoId_fkey" FOREIGN KEY ("ejecutivoId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PagoMensual PagoMensual_operacionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PagoMensual"
    ADD CONSTRAINT "PagoMensual_operacionId_fkey" FOREIGN KEY ("operacionId") REFERENCES public."Operacion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PagoMensual PagoMensual_registradoPorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PagoMensual"
    ADD CONSTRAINT "PagoMensual_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Solicitud Solicitud_dirigidaAId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Solicitud"
    ADD CONSTRAINT "Solicitud_dirigidaAId_fkey" FOREIGN KEY ("dirigidaAId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Solicitud Solicitud_generadaPorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Solicitud"
    ADD CONSTRAINT "Solicitud_generadaPorId_fkey" FOREIGN KEY ("generadaPorId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Solicitud Solicitud_operacionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Solicitud"
    ADD CONSTRAINT "Solicitud_operacionId_fkey" FOREIGN KEY ("operacionId") REFERENCES public."Operacion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict OvZVsoJjXwnFzNoyRYGQYfHpePVArW30JbWRFNaqdYr7mt7L6klZg0A58fjJPaz

