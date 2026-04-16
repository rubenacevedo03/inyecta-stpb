-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'OPERADOR', 'CONSULTOR');

-- CreateEnum
CREATE TYPE "StatusOp" AS ENUM ('PROSPECTO', 'ANALISIS', 'APROBADA', 'ACTIVA', 'LIQUIDADA', 'EN_MORA', 'EJECUTADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusPago" AS ENUM ('PENDIENTE', 'PAGADO', 'PARCIAL', 'VENCIDO', 'PERDONADO');

-- CreateEnum
CREATE TYPE "TipoDoc" AS ENUM ('CORRIDA_ACREDITADO', 'CORRIDA_INVERSIONISTA', 'CONTRATO_CREDITO', 'CONTRATO_FIDEICOMISO', 'AVALUO', 'SEGURO', 'IDENTIFICACION', 'COMPROBANTE_INGRESOS', 'OTRO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'OPERADOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Acreditado" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rfc" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Acreditado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inversionista" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rfc" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "banco" TEXT,
    "cuentaClabe" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inversionista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operacion" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "acreditadoId" TEXT NOT NULL,
    "operadorId" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "tasaAnual" DOUBLE PRECISION NOT NULL,
    "plazoMeses" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "comisionApertura" DOUBLE PRECISION NOT NULL DEFAULT 0.03,
    "spreadSofom" DOUBLE PRECISION NOT NULL DEFAULT 0.12,
    "adminFideicomiso" DOUBLE PRECISION NOT NULL DEFAULT 0.015,
    "comisionCobranza" DOUBLE PRECISION NOT NULL DEFAULT 0.005,
    "status" "StatusOp" NOT NULL DEFAULT 'PROSPECTO',
    "folioPld" TEXT,
    "valorInmueble" DOUBLE PRECISION,
    "ltv" DOUBLE PRECISION,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipacionInv" (
    "id" TEXT NOT NULL,
    "operacionId" TEXT NOT NULL,
    "inversionistaId" TEXT NOT NULL,
    "porcentaje" DOUBLE PRECISION NOT NULL,
    "montoAportado" DOUBLE PRECISION NOT NULL,
    "tasaNeta" DOUBLE PRECISION NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParticipacionInv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoMensual" (
    "id" TEXT NOT NULL,
    "operacionId" TEXT NOT NULL,
    "numeroPago" INTEGER NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "fechaPago" TIMESTAMP(3),
    "capitalTotal" DOUBLE PRECISION NOT NULL,
    "interesTotal" DOUBLE PRECISION NOT NULL,
    "pagoTotal" DOUBLE PRECISION NOT NULL,
    "saldo" DOUBLE PRECISION NOT NULL,
    "status" "StatusPago" NOT NULL DEFAULT 'PENDIENTE',
    "montoPagado" DOUBLE PRECISION,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagoMensual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "operacionId" TEXT NOT NULL,
    "tipo" "TipoDoc" NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tamano" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Operacion_folio_key" ON "Operacion"("folio");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipacionInv_operacionId_inversionistaId_key" ON "ParticipacionInv"("operacionId", "inversionistaId");

-- AddForeignKey
ALTER TABLE "Operacion" ADD CONSTRAINT "Operacion_acreditadoId_fkey" FOREIGN KEY ("acreditadoId") REFERENCES "Acreditado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operacion" ADD CONSTRAINT "Operacion_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipacionInv" ADD CONSTRAINT "ParticipacionInv_operacionId_fkey" FOREIGN KEY ("operacionId") REFERENCES "Operacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipacionInv" ADD CONSTRAINT "ParticipacionInv_inversionistaId_fkey" FOREIGN KEY ("inversionistaId") REFERENCES "Inversionista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoMensual" ADD CONSTRAINT "PagoMensual_operacionId_fkey" FOREIGN KEY ("operacionId") REFERENCES "Operacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_operacionId_fkey" FOREIGN KEY ("operacionId") REFERENCES "Operacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
