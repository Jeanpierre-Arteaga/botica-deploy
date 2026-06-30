--
-- PostgreSQL database dump
--


-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

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
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.category (
    category_id integer NOT NULL,
    category_name character varying(255) NOT NULL,
    category_description text,
    icon_name character varying(50) DEFAULT 'Package'::character varying,
    color_hex character varying(7) DEFAULT '#F26430'::character varying,
    is_featured boolean DEFAULT false,
    display_order integer DEFAULT 999
);


--
-- Name: category_category_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.category_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: category_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.category_category_id_seq OWNED BY public.category.category_id;


--
-- Name: customer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer (
    customer_id integer NOT NULL,
    full_name character varying(255) NOT NULL,
    dni character(8),
    address character varying(255),
    phone character(9),
    email character varying(255),
    customer_password character varying(255),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    photo_url character varying(500),
    twofa_code_hash character varying(64),
    twofa_expires_at timestamp without time zone,
    twofa_attempts integer DEFAULT 0 NOT NULL,
    twofa_sent_at timestamp without time zone
);


--
-- Name: customer_customer_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customer_customer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customer_customer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customer_customer_id_seq OWNED BY public.customer.customer_id;


--
-- Name: image; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.image (
    image_id integer NOT NULL,
    url character varying(500) NOT NULL,
    type character varying(50) DEFAULT 'main'::character varying,
    product_id integer NOT NULL,
    CONSTRAINT image_type_check CHECK (((type)::text = ANY ((ARRAY['main'::character varying, 'gallery'::character varying, 'thumbnail'::character varying])::text[])))
);


--
-- Name: image_image_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.image_image_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: image_image_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.image_image_id_seq OWNED BY public.image.image_id;


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory (
    inventory_id integer NOT NULL,
    current_stock integer DEFAULT 0 NOT NULL,
    min_stock integer DEFAULT 0 NOT NULL,
    product_id integer NOT NULL,
    location_id integer NOT NULL,
    CONSTRAINT inventory_current_stock_check CHECK ((current_stock >= 0)),
    CONSTRAINT inventory_min_stock_check CHECK ((min_stock >= 0))
);


--
-- Name: inventory_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_inventory_id_seq OWNED BY public.inventory.inventory_id;


--
-- Name: laboratory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.laboratory (
    laboratory_id integer NOT NULL,
    laboratory_name character varying(255) NOT NULL,
    laboratory_country character varying(255)
);


--
-- Name: laboratory_laboratory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.laboratory_laboratory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: laboratory_laboratory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.laboratory_laboratory_id_seq OWNED BY public.laboratory.laboratory_id;


--
-- Name: location; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.location (
    location_id integer NOT NULL,
    location_name character varying(255) NOT NULL,
    location_address character varying(255),
    district character varying(255),
    location_phone character(9),
    location_email character varying(255),
    schedule character varying(255),
    maps_query text,
    latitude numeric(10,7),
    longitude numeric(10,7),
    is_active boolean DEFAULT true
);


--
-- Name: location_location_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.location_location_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: location_location_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.location_location_id_seq OWNED BY public.location.location_id;


--
-- Name: order_detail; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_detail (
    detail_id integer NOT NULL,
    amount integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    sub_total_price numeric(10,2) NOT NULL,
    product_id integer,
    order_id integer NOT NULL,
    CONSTRAINT order_detail_amount_check CHECK ((amount > 0)),
    CONSTRAINT order_detail_sub_total_price_check CHECK ((sub_total_price >= (0)::numeric)),
    CONSTRAINT order_detail_unit_price_check CHECK ((unit_price >= (0)::numeric))
);


--
-- Name: order_detail_detail_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_detail_detail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_detail_detail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_detail_detail_id_seq OWNED BY public.order_detail.detail_id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    order_id integer NOT NULL,
    order_state character varying(50) DEFAULT 'pendiente'::character varying NOT NULL,
    delivery_type character varying(50),
    order_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total_price numeric(10,2) NOT NULL,
    delivery_address character varying(255),
    delivery_phone character(9),
    delivery_notes text,
    cancelled_by_user_id integer,
    cancelled_at timestamp without time zone,
    cancellation_reason character varying(255),
    refund_processed boolean DEFAULT false,
    stock_discounted boolean DEFAULT false NOT NULL,
    customer_id integer,
    user_id integer,
    location_id integer,
    CONSTRAINT orders_delivery_type_check CHECK ((((delivery_type)::text = ANY ((ARRAY['delivery'::character varying, 'pickup'::character varying])::text[])) OR (delivery_type IS NULL))),
    CONSTRAINT orders_order_state_check CHECK (((order_state)::text = ANY ((ARRAY['pendiente'::character varying, 'en proceso'::character varying, 'entregado'::character varying, 'cancelado'::character varying])::text[]))),
    CONSTRAINT orders_total_price_check CHECK ((total_price >= (0)::numeric))
);


--
-- Name: orders_order_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_order_id_seq OWNED BY public.orders.order_id;


--
-- Name: password_reset; Type: TABLE; Schema: public; Owner: -
--

-- Tokens de recuperación de contraseña. Cada token pertenece a EXACTAMENTE uno:
-- un cliente (customer_id) o un usuario de personal/admin (user_id), nunca ambos
-- (ver CHECK password_reset_owner_chk más abajo).
CREATE TABLE public.password_reset (
    reset_id integer NOT NULL,
    customer_id integer,
    token_hash character(64) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_id integer,
    CONSTRAINT password_reset_owner_chk CHECK (((customer_id IS NOT NULL) <> (user_id IS NOT NULL)))
);


--
-- Name: password_reset_reset_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_reset_reset_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_reset_reset_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_reset_reset_id_seq OWNED BY public.password_reset.reset_id;


--
-- Name: payment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment (
    payment_id integer NOT NULL,
    payment_method character varying(50),
    total_price numeric(10,2) NOT NULL,
    voucher_type character varying(50),
    email_pay character varying(255),
    phone_pay character(9),
    mp_payment_id character varying(50),
    mp_status character varying(50),
    mp_status_detail character varying(100),
    voucher_pdf_url character varying(500),
    billing_ruc character varying(11),
    billing_name character varying(200),
    order_id integer NOT NULL,
    CONSTRAINT payment_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['efectivo'::character varying, 'yape'::character varying, 'plin'::character varying, 'tarjeta'::character varying, 'transferencia'::character varying])::text[]))),
    CONSTRAINT payment_total_price_check CHECK ((total_price >= (0)::numeric)),
    CONSTRAINT payment_voucher_type_check CHECK ((((voucher_type)::text = ANY ((ARRAY['boleta'::character varying, 'factura'::character varying, 'ticket'::character varying])::text[])) OR (voucher_type IS NULL)))
);


--
-- Name: payment_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_payment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_payment_id_seq OWNED BY public.payment.payment_id;


--
-- Name: product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product (
    product_id integer NOT NULL,
    product_name character varying(255) NOT NULL,
    active_ingredient character varying(255),
    product_composition text,
    contraindications text,
    adverse_effects text,
    product_batch character varying(255),
    expiration_date date,
    health_record character varying(255),
    is_generic boolean DEFAULT false,
    product_price numeric(10,2) NOT NULL,
    old_price numeric(10,2),
    is_active boolean DEFAULT true,
    is_offer boolean DEFAULT false,
    laboratory_id integer,
    category_id integer,
    CONSTRAINT product_old_price_check CHECK (((old_price IS NULL) OR (old_price >= (0)::numeric))),
    CONSTRAINT product_product_price_check CHECK ((product_price >= (0)::numeric))
);


--
-- Name: product_product_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_product_id_seq OWNED BY public.product.product_id;


--
-- Name: trusted_device; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trusted_device (
    device_id integer NOT NULL,
    user_id integer NOT NULL,
    token_hash character varying(64) NOT NULL,
    label character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    last_used_at timestamp without time zone,
    expires_at timestamp without time zone NOT NULL
);


--
-- Name: trusted_device_device_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.trusted_device_device_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: trusted_device_device_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.trusted_device_device_id_seq OWNED BY public.trusted_device.device_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    user_code character varying(50) NOT NULL,
    user_password character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    location_id integer,
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    photo_url character varying(500),
    failed_attempts integer DEFAULT 0 NOT NULL,
    locked_until timestamp without time zone,
    email character varying(255),
    twofa_code_hash character varying(64),
    twofa_expires_at timestamp without time zone,
    twofa_attempts integer DEFAULT 0 NOT NULL,
    twofa_sent_at timestamp without time zone,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'emp'::character varying])::text[])))
);


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: category category_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category ALTER COLUMN category_id SET DEFAULT nextval('public.category_category_id_seq'::regclass);


--
-- Name: customer customer_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer ALTER COLUMN customer_id SET DEFAULT nextval('public.customer_customer_id_seq'::regclass);


--
-- Name: image image_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image ALTER COLUMN image_id SET DEFAULT nextval('public.image_image_id_seq'::regclass);


--
-- Name: inventory inventory_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory ALTER COLUMN inventory_id SET DEFAULT nextval('public.inventory_inventory_id_seq'::regclass);


--
-- Name: laboratory laboratory_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laboratory ALTER COLUMN laboratory_id SET DEFAULT nextval('public.laboratory_laboratory_id_seq'::regclass);


--
-- Name: location location_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location ALTER COLUMN location_id SET DEFAULT nextval('public.location_location_id_seq'::regclass);


--
-- Name: order_detail detail_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_detail ALTER COLUMN detail_id SET DEFAULT nextval('public.order_detail_detail_id_seq'::regclass);


--
-- Name: orders order_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN order_id SET DEFAULT nextval('public.orders_order_id_seq'::regclass);


--
-- Name: password_reset reset_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset ALTER COLUMN reset_id SET DEFAULT nextval('public.password_reset_reset_id_seq'::regclass);


--
-- Name: payment payment_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment ALTER COLUMN payment_id SET DEFAULT nextval('public.payment_payment_id_seq'::regclass);


--
-- Name: product product_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product ALTER COLUMN product_id SET DEFAULT nextval('public.product_product_id_seq'::regclass);


--
-- Name: trusted_device device_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_device ALTER COLUMN device_id SET DEFAULT nextval('public.trusted_device_device_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: category; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.category VALUES (1, 'Medicamentos', 'Medicinas con o sin receta médica', 'Pill', '#1E4D8C', true, 10);
INSERT INTO public.category VALUES (2, 'Analgésicos', 'Medicamentos para aliviar el dolor', 'Pill', '#DC2626', true, 15);
INSERT INTO public.category VALUES (3, 'Mamá & Bebé', 'Productos para el cuidado de bebés y madres', 'Baby', '#EC4899', true, 20);
INSERT INTO public.category VALUES (4, 'Vitaminas', 'Suplementos vitamínicos y nutricionales', 'Apple', '#10B981', true, 30);
INSERT INTO public.category VALUES (5, 'Genéricos', 'Medicamentos genéricos a precios accesibles', 'Heart', '#F59E0B', true, 40);
INSERT INTO public.category VALUES (6, 'Antigripales', 'Productos para resfriado, gripe y congestión', 'Thermometer', '#3B82F6', true, 45);
INSERT INTO public.category VALUES (7, 'Antibióticos', 'Tratamiento de infecciones bacterianas', 'ShieldCheck', '#0EA5E9', false, 25);
INSERT INTO public.category VALUES (8, 'Antialérgicos', 'Alivio de síntomas alérgicos y rinitis', 'Wind', '#84CC16', false, 35);
INSERT INTO public.category VALUES (9, 'Cuidado Personal', 'Higiene y belleza personal', 'Sparkles', '#8B5CF6', false, 50);
INSERT INTO public.category VALUES (10, 'Dermatología', 'Cuidado de la piel y dermatosis', 'Droplet', '#F472B6', false, 55);
INSERT INTO public.category VALUES (11, 'Cuidado del Hogar', 'Productos de limpieza y desinfección', 'Home', '#06B6D4', false, 60);
INSERT INTO public.category VALUES (12, 'Gastroenterología', 'Salud digestiva, antiácidos y protectores gástricos', 'Soup', '#FACC15', false, 65);
INSERT INTO public.category VALUES (13, 'Cardiovascular', 'Salud del corazón y sistema circulatorio', 'HeartPulse', '#EF4444', false, 75);
INSERT INTO public.category VALUES (14, 'Diabetes', 'Cuidado para personas con diabetes', 'Activity', '#06B6D4', false, 85);
INSERT INTO public.category VALUES (15, 'Respiratorio', 'Inhaladores y tratamientos respiratorios', 'Wind', '#0891B2', false, 95);


--
-- Data for Name: customer; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.customer VALUES (2, 'Ivanna Santos', '12345678', 'Av. Javier Prado 456, San Isidro', '912345678', 'ivanna@test.com', '$2a$10$K4fgrHPUKtcSIrxXjCL/i.Aeng0i49IEestTlJRhKu/b/0TTHofdK', true, '2026-06-29 15:31:46.105377', NULL);
INSERT INTO public.customer VALUES (1, 'Matteo Arteaga', '87654321', 'Av. Salaverry 123, Lima', '987654321', 'matteo@test.com', '$2a$10$fv1qpwZCsoR.TFT7x.YEMefTQq4u1UyOI7P7FmqEMuCy35fOFOa4G', true, '2026-06-29 15:31:46.105377', '/avatars/av-6.svg');


--
-- Data for Name: image; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.image VALUES (1, 'https://d2gt6w64qg7rtz.cloudfront.net/products/1-122faea9.webp', 'main', 1);
INSERT INTO public.image VALUES (2, 'https://d2gt6w64qg7rtz.cloudfront.net/products/2-0d396d79.webp', 'main', 2);
INSERT INTO public.image VALUES (3, 'https://d2gt6w64qg7rtz.cloudfront.net/products/3-500de201.webp', 'main', 3);
INSERT INTO public.image VALUES (4, 'https://d2gt6w64qg7rtz.cloudfront.net/products/4-483d95a8.webp', 'main', 4);
INSERT INTO public.image VALUES (5, 'https://d2gt6w64qg7rtz.cloudfront.net/products/5-5bfa970c.webp', 'main', 5);
INSERT INTO public.image VALUES (6, 'https://d2gt6w64qg7rtz.cloudfront.net/products/6-1f94fde4.webp', 'main', 6);
INSERT INTO public.image VALUES (7, 'https://d2gt6w64qg7rtz.cloudfront.net/products/7-7f0189c6.webp', 'main', 7);
INSERT INTO public.image VALUES (8, 'https://d2gt6w64qg7rtz.cloudfront.net/products/8-c49932c3.webp', 'main', 8);
INSERT INTO public.image VALUES (9, 'https://d2gt6w64qg7rtz.cloudfront.net/products/9-f8d45491.webp', 'main', 9);
INSERT INTO public.image VALUES (10, 'https://d2gt6w64qg7rtz.cloudfront.net/products/10-96396076.webp', 'main', 10);
INSERT INTO public.image VALUES (11, 'https://d2gt6w64qg7rtz.cloudfront.net/products/11-a42d7ef7.webp', 'main', 11);
INSERT INTO public.image VALUES (12, 'https://d2gt6w64qg7rtz.cloudfront.net/products/12-533d5c13.webp', 'main', 12);
INSERT INTO public.image VALUES (13, 'https://d2gt6w64qg7rtz.cloudfront.net/products/13-504eff95.webp', 'main', 13);
INSERT INTO public.image VALUES (14, 'https://d2gt6w64qg7rtz.cloudfront.net/products/14-b020ff07.webp', 'main', 14);
INSERT INTO public.image VALUES (15, 'https://d2gt6w64qg7rtz.cloudfront.net/products/15-df03c278.webp', 'main', 15);
INSERT INTO public.image VALUES (16, 'https://d2gt6w64qg7rtz.cloudfront.net/products/16-e98be807.webp', 'main', 16);
INSERT INTO public.image VALUES (17, 'https://d2gt6w64qg7rtz.cloudfront.net/products/17-63f23aec.webp', 'main', 17);
INSERT INTO public.image VALUES (18, 'https://d2gt6w64qg7rtz.cloudfront.net/products/18-2af5f6c1.webp', 'main', 18);
INSERT INTO public.image VALUES (19, 'https://d2gt6w64qg7rtz.cloudfront.net/products/19-90e28b2e.webp', 'main', 19);
INSERT INTO public.image VALUES (20, 'https://d2gt6w64qg7rtz.cloudfront.net/products/20-e572a6a0.webp', 'main', 20);
INSERT INTO public.image VALUES (21, 'https://d2gt6w64qg7rtz.cloudfront.net/products/21-3a40a031.webp', 'main', 21);
INSERT INTO public.image VALUES (22, 'https://d2gt6w64qg7rtz.cloudfront.net/products/22-3719fca3.webp', 'main', 22);
INSERT INTO public.image VALUES (23, 'https://d2gt6w64qg7rtz.cloudfront.net/products/23-b95d4b42.webp', 'main', 23);
INSERT INTO public.image VALUES (24, 'https://d2gt6w64qg7rtz.cloudfront.net/products/24-2733e709.webp', 'main', 24);
INSERT INTO public.image VALUES (25, 'https://d2gt6w64qg7rtz.cloudfront.net/products/25-b888a172.webp', 'main', 25);
INSERT INTO public.image VALUES (26, 'https://d2gt6w64qg7rtz.cloudfront.net/products/26-302a0543.webp', 'main', 26);
INSERT INTO public.image VALUES (27, 'https://d2gt6w64qg7rtz.cloudfront.net/products/27-4493974e.webp', 'main', 27);
INSERT INTO public.image VALUES (28, 'https://d2gt6w64qg7rtz.cloudfront.net/products/28-66170a16.webp', 'main', 28);
INSERT INTO public.image VALUES (29, 'https://d2gt6w64qg7rtz.cloudfront.net/products/29-f9aa5860.webp', 'main', 29);
INSERT INTO public.image VALUES (30, 'https://d2gt6w64qg7rtz.cloudfront.net/products/30-1b79083d.webp', 'main', 30);
INSERT INTO public.image VALUES (31, 'https://d2gt6w64qg7rtz.cloudfront.net/products/31-7bcddbfd.webp', 'main', 31);
INSERT INTO public.image VALUES (32, 'https://d2gt6w64qg7rtz.cloudfront.net/products/32-3820033b.webp', 'main', 32);
INSERT INTO public.image VALUES (33, 'https://d2gt6w64qg7rtz.cloudfront.net/products/33-ec14c8d6.webp', 'main', 33);
INSERT INTO public.image VALUES (34, 'https://d2gt6w64qg7rtz.cloudfront.net/products/34-12af11c7.webp', 'main', 34);
INSERT INTO public.image VALUES (35, 'https://d2gt6w64qg7rtz.cloudfront.net/products/35-9f8abcce.webp', 'main', 35);
INSERT INTO public.image VALUES (36, 'https://d2gt6w64qg7rtz.cloudfront.net/products/36-2e48402e.webp', 'main', 36);
INSERT INTO public.image VALUES (37, 'https://d2gt6w64qg7rtz.cloudfront.net/products/37-a6293774.webp', 'main', 37);
INSERT INTO public.image VALUES (38, 'https://d2gt6w64qg7rtz.cloudfront.net/products/38-cdd1f622.webp', 'main', 38);
INSERT INTO public.image VALUES (39, 'https://d2gt6w64qg7rtz.cloudfront.net/products/39-a314355c.webp', 'main', 39);
INSERT INTO public.image VALUES (40, 'https://d2gt6w64qg7rtz.cloudfront.net/products/40-4fd54988.webp', 'main', 40);
INSERT INTO public.image VALUES (41, 'https://d2gt6w64qg7rtz.cloudfront.net/products/41-34031b89.webp', 'main', 41);
INSERT INTO public.image VALUES (42, 'https://d2gt6w64qg7rtz.cloudfront.net/products/42-d80d7821.webp', 'main', 42);
INSERT INTO public.image VALUES (43, 'https://d2gt6w64qg7rtz.cloudfront.net/products/43-9982d52b.webp', 'main', 43);
INSERT INTO public.image VALUES (44, 'https://d2gt6w64qg7rtz.cloudfront.net/products/44-be14c5ec.webp', 'main', 44);
INSERT INTO public.image VALUES (45, 'https://d2gt6w64qg7rtz.cloudfront.net/products/45-f6dae7a0.webp', 'main', 45);
INSERT INTO public.image VALUES (46, 'https://d2gt6w64qg7rtz.cloudfront.net/products/46-53deace2.webp', 'main', 46);
INSERT INTO public.image VALUES (47, 'https://d2gt6w64qg7rtz.cloudfront.net/products/47-05bb9a19.webp', 'main', 47);
INSERT INTO public.image VALUES (48, 'https://d2gt6w64qg7rtz.cloudfront.net/products/48-30aaf124.webp', 'main', 48);
INSERT INTO public.image VALUES (49, 'https://d2gt6w64qg7rtz.cloudfront.net/products/49-3ef597eb.webp', 'main', 49);
INSERT INTO public.image VALUES (50, 'https://d2gt6w64qg7rtz.cloudfront.net/products/50-a178f710.webp', 'main', 50);
INSERT INTO public.image VALUES (51, 'https://d2gt6w64qg7rtz.cloudfront.net/products/51-f6010777.webp', 'main', 51);
INSERT INTO public.image VALUES (52, 'https://placehold.co/400x400/FFF4EE/F26430?text=Producto+52', 'main', 52);
INSERT INTO public.image VALUES (53, 'https://d2gt6w64qg7rtz.cloudfront.net/products/53-ddd9153b.webp', 'main', 53);
INSERT INTO public.image VALUES (54, 'https://d2gt6w64qg7rtz.cloudfront.net/products/54-ecbf16d0.webp', 'main', 54);
INSERT INTO public.image VALUES (55, 'https://d2gt6w64qg7rtz.cloudfront.net/products/55-d8f6ea4e.webp', 'main', 55);
INSERT INTO public.image VALUES (56, 'https://d2gt6w64qg7rtz.cloudfront.net/products/56-1e0e03af.webp', 'main', 56);
INSERT INTO public.image VALUES (57, 'https://d2gt6w64qg7rtz.cloudfront.net/products/57-8118e618.webp', 'main', 57);
INSERT INTO public.image VALUES (58, 'https://d2gt6w64qg7rtz.cloudfront.net/products/58-19636d82.webp', 'main', 58);
INSERT INTO public.image VALUES (59, 'https://d2gt6w64qg7rtz.cloudfront.net/products/59-c0d1ea27.webp', 'main', 59);
INSERT INTO public.image VALUES (60, 'https://d2gt6w64qg7rtz.cloudfront.net/products/60-437e6077.webp', 'main', 60);
INSERT INTO public.image VALUES (61, 'https://d2gt6w64qg7rtz.cloudfront.net/products/61-342ec551.webp', 'main', 61);
INSERT INTO public.image VALUES (62, 'https://d2gt6w64qg7rtz.cloudfront.net/products/62-2c40e5ee.webp', 'main', 62);
INSERT INTO public.image VALUES (63, 'https://d2gt6w64qg7rtz.cloudfront.net/products/63-0e865d1a.webp', 'main', 63);
INSERT INTO public.image VALUES (64, 'https://d2gt6w64qg7rtz.cloudfront.net/products/64-3699bffd.webp', 'main', 64);
INSERT INTO public.image VALUES (65, 'https://d2gt6w64qg7rtz.cloudfront.net/products/65-8bb34a7c.webp', 'main', 65);
INSERT INTO public.image VALUES (66, 'https://d2gt6w64qg7rtz.cloudfront.net/products/66-3cc3283d.webp', 'main', 66);
INSERT INTO public.image VALUES (67, 'https://d2gt6w64qg7rtz.cloudfront.net/products/67-c3c79f18.webp', 'main', 67);
INSERT INTO public.image VALUES (68, 'https://d2gt6w64qg7rtz.cloudfront.net/products/68-43684846.webp', 'main', 68);
INSERT INTO public.image VALUES (69, 'https://d2gt6w64qg7rtz.cloudfront.net/products/69-34209fb9.webp', 'main', 69);
INSERT INTO public.image VALUES (70, 'https://d2gt6w64qg7rtz.cloudfront.net/products/70-5a24a6f6.webp', 'main', 70);
INSERT INTO public.image VALUES (71, 'https://d2gt6w64qg7rtz.cloudfront.net/products/71-e23ebb7a.webp', 'main', 71);
INSERT INTO public.image VALUES (72, 'https://d2gt6w64qg7rtz.cloudfront.net/products/72-33c63c2e.webp', 'main', 72);
INSERT INTO public.image VALUES (73, 'https://d2gt6w64qg7rtz.cloudfront.net/products/73-b5ee0b4f.webp', 'main', 73);
INSERT INTO public.image VALUES (74, 'https://d2gt6w64qg7rtz.cloudfront.net/products/74-20802892.webp', 'main', 74);
INSERT INTO public.image VALUES (75, 'https://d2gt6w64qg7rtz.cloudfront.net/products/75-ea4fc14f.webp', 'main', 75);
INSERT INTO public.image VALUES (76, 'https://d2gt6w64qg7rtz.cloudfront.net/products/76-1d1ef87d.webp', 'main', 76);
INSERT INTO public.image VALUES (77, 'https://d2gt6w64qg7rtz.cloudfront.net/products/77-95ea8344.webp', 'main', 77);
INSERT INTO public.image VALUES (78, 'https://d2gt6w64qg7rtz.cloudfront.net/products/78-33e94e40.webp', 'main', 78);
INSERT INTO public.image VALUES (79, 'https://d2gt6w64qg7rtz.cloudfront.net/products/79-649f9345.webp', 'main', 79);
INSERT INTO public.image VALUES (80, 'https://d2gt6w64qg7rtz.cloudfront.net/products/80-e018ac58.webp', 'main', 80);
INSERT INTO public.image VALUES (81, 'https://d2gt6w64qg7rtz.cloudfront.net/products/81-3a40a031.webp', 'main', 81);
INSERT INTO public.image VALUES (82, 'https://d2gt6w64qg7rtz.cloudfront.net/products/0a2d0462-c715-4d93-8dde-266a2522e3a9.png', 'main', 82);
INSERT INTO public.image VALUES (83, 'https://placehold.co/400x400/FFF4EE/F26430?text=Producto+83', 'main', 83);
INSERT INTO public.image VALUES (84, 'https://placehold.co/400x400/FFF4EE/F26430?text=Producto+84', 'main', 84);
INSERT INTO public.image VALUES (85, 'https://placehold.co/400x400/FFF4EE/F26430?text=Producto+85', 'main', 85);
INSERT INTO public.image VALUES (86, 'https://placehold.co/400x400/FFF4EE/F26430?text=Producto+86', 'main', 86);
INSERT INTO public.image VALUES (87, 'https://placehold.co/400x400/FFF4EE/F26430?text=Producto+87', 'main', 87);
INSERT INTO public.image VALUES (88, 'https://placehold.co/400x400/FFF4EE/F26430?text=Producto+88', 'main', 88);
INSERT INTO public.image VALUES (89, 'https://placehold.co/400x400/FFF4EE/F26430?text=Producto+89', 'main', 89);
INSERT INTO public.image VALUES (90, 'https://placehold.co/400x400/FFF4EE/F26430?text=Producto+90', 'main', 90);
INSERT INTO public.image VALUES (91, 'https://placehold.co/400x400/FFF4EE/F26430?text=Producto+91', 'main', 91);
INSERT INTO public.image VALUES (92, 'https://placehold.co/400x400/FFF4EE/F26430?text=Producto+92', 'main', 92);
INSERT INTO public.image VALUES (93, 'https://placehold.co/400x400/FFF4EE/F26430?text=Producto+93', 'main', 93);
INSERT INTO public.image VALUES (94, 'https://placehold.co/400x400/FFF4EE/F26430?text=Producto+94', 'main', 94);
INSERT INTO public.image VALUES (95, 'https://placehold.co/400x400/FFF4EE/F26430?text=Producto+95', 'main', 95);
INSERT INTO public.image VALUES (96, 'https://placehold.co/400x400/FFF4EE/F26430?text=Producto+96', 'main', 96);
INSERT INTO public.image VALUES (97, 'https://placehold.co/400x400/FFF4EE/F26430?text=Producto+97', 'main', 97);
INSERT INTO public.image VALUES (98, 'https://placehold.co/400x400/FFF4EE/F26430?text=Producto+98', 'main', 98);
INSERT INTO public.image VALUES (99, 'https://placehold.co/400x400/FFF4EE/F26430?text=Producto+99', 'main', 99);
INSERT INTO public.image VALUES (100, 'https://placehold.co/400x400/FFF4EE/F26430?text=Producto+100', 'main', 100);
INSERT INTO public.image VALUES (101, 'https://d2gt6w64qg7rtz.cloudfront.net/products/101-f65c2af1.webp', 'main', 101);
INSERT INTO public.image VALUES (102, 'https://d2gt6w64qg7rtz.cloudfront.net/products/102-8be6d064.webp', 'main', 102);
INSERT INTO public.image VALUES (103, 'https://d2gt6w64qg7rtz.cloudfront.net/products/103-2c524f8c.webp', 'main', 103);
INSERT INTO public.image VALUES (104, 'https://d2gt6w64qg7rtz.cloudfront.net/products/104-b90998bb.webp', 'main', 104);
INSERT INTO public.image VALUES (105, 'https://d2gt6w64qg7rtz.cloudfront.net/products/105-6754129e.webp', 'main', 105);
INSERT INTO public.image VALUES (106, 'https://d2gt6w64qg7rtz.cloudfront.net/products/106-5f34b70b.webp', 'main', 106);
INSERT INTO public.image VALUES (107, 'https://d2gt6w64qg7rtz.cloudfront.net/products/107-95f4aac3.webp', 'main', 107);
INSERT INTO public.image VALUES (108, 'https://d2gt6w64qg7rtz.cloudfront.net/products/108-af3d6c46.webp', 'main', 108);
INSERT INTO public.image VALUES (109, 'https://d2gt6w64qg7rtz.cloudfront.net/products/109-d90ac054.webp', 'main', 109);
INSERT INTO public.image VALUES (110, 'https://d2gt6w64qg7rtz.cloudfront.net/products/110-45725534.webp', 'main', 110);
INSERT INTO public.image VALUES (111, 'https://d2gt6w64qg7rtz.cloudfront.net/products/111-b556ee92.webp', 'main', 111);
INSERT INTO public.image VALUES (112, 'https://d2gt6w64qg7rtz.cloudfront.net/products/112-98a6a717.webp', 'main', 112);
INSERT INTO public.image VALUES (113, 'https://d2gt6w64qg7rtz.cloudfront.net/products/113-6759bb23.webp', 'main', 113);
INSERT INTO public.image VALUES (114, 'https://d2gt6w64qg7rtz.cloudfront.net/products/114-dd67fc92.webp', 'main', 114);
INSERT INTO public.image VALUES (115, 'https://d2gt6w64qg7rtz.cloudfront.net/products/115-c5085eea.webp', 'main', 115);
INSERT INTO public.image VALUES (116, 'https://d2gt6w64qg7rtz.cloudfront.net/products/116-0800a9df.webp', 'main', 116);
INSERT INTO public.image VALUES (117, 'https://d2gt6w64qg7rtz.cloudfront.net/products/117-a135d88f.webp', 'main', 117);
INSERT INTO public.image VALUES (118, 'https://d2gt6w64qg7rtz.cloudfront.net/products/118-a420f4df.webp', 'main', 118);
INSERT INTO public.image VALUES (119, 'https://d2gt6w64qg7rtz.cloudfront.net/products/119-2462e410.webp', 'main', 119);
INSERT INTO public.image VALUES (120, 'https://d2gt6w64qg7rtz.cloudfront.net/products/120-1d1b0735.webp', 'main', 120);
INSERT INTO public.image VALUES (121, 'https://d2gt6w64qg7rtz.cloudfront.net/products/121-a6fa88e4.webp', 'main', 121);
INSERT INTO public.image VALUES (122, 'https://d2gt6w64qg7rtz.cloudfront.net/products/122-d4746e38.webp', 'main', 122);
INSERT INTO public.image VALUES (123, 'https://d2gt6w64qg7rtz.cloudfront.net/products/123-52f04284.webp', 'main', 123);
INSERT INTO public.image VALUES (124, 'https://d2gt6w64qg7rtz.cloudfront.net/products/124-5c13368d.webp', 'main', 124);
INSERT INTO public.image VALUES (125, 'https://d2gt6w64qg7rtz.cloudfront.net/products/125-0cb3fc40.webp', 'main', 125);
INSERT INTO public.image VALUES (126, 'https://d2gt6w64qg7rtz.cloudfront.net/products/126-19ad0766.webp', 'main', 126);
INSERT INTO public.image VALUES (127, 'https://d2gt6w64qg7rtz.cloudfront.net/products/127-9a5d150e.webp', 'main', 127);
INSERT INTO public.image VALUES (128, 'https://d2gt6w64qg7rtz.cloudfront.net/products/128-c8c20a6c.webp', 'main', 128);
INSERT INTO public.image VALUES (129, 'https://d2gt6w64qg7rtz.cloudfront.net/products/129-0fb1f54d.webp', 'main', 129);
INSERT INTO public.image VALUES (130, 'https://d2gt6w64qg7rtz.cloudfront.net/products/130-cab5b7d7.webp', 'main', 130);
INSERT INTO public.image VALUES (131, 'https://d2gt6w64qg7rtz.cloudfront.net/products/131-e6669a40.webp', 'main', 131);
INSERT INTO public.image VALUES (132, 'https://d2gt6w64qg7rtz.cloudfront.net/products/132-eeeba6b9.webp', 'main', 132);
INSERT INTO public.image VALUES (133, 'https://d2gt6w64qg7rtz.cloudfront.net/products/133-efe38ee4.webp', 'main', 133);
INSERT INTO public.image VALUES (134, 'https://d2gt6w64qg7rtz.cloudfront.net/products/134-dc992be4.webp', 'main', 134);
INSERT INTO public.image VALUES (135, 'https://d2gt6w64qg7rtz.cloudfront.net/products/135-cf81ccbd.webp', 'main', 135);
INSERT INTO public.image VALUES (136, 'https://d2gt6w64qg7rtz.cloudfront.net/products/136-26e44c20.webp', 'main', 136);
INSERT INTO public.image VALUES (137, 'https://d2gt6w64qg7rtz.cloudfront.net/products/137-105a1b59.webp', 'main', 137);
INSERT INTO public.image VALUES (138, 'https://d2gt6w64qg7rtz.cloudfront.net/products/138-44f1328a.webp', 'main', 138);
INSERT INTO public.image VALUES (139, 'https://d2gt6w64qg7rtz.cloudfront.net/products/139-8e766c5a.webp', 'main', 139);
INSERT INTO public.image VALUES (140, 'https://d2gt6w64qg7rtz.cloudfront.net/products/140-15e5f6cd.webp', 'main', 140);
INSERT INTO public.image VALUES (141, 'https://d2gt6w64qg7rtz.cloudfront.net/products/141-0fcf19c3.webp', 'main', 141);
INSERT INTO public.image VALUES (142, 'https://d2gt6w64qg7rtz.cloudfront.net/products/142-89be9e36.webp', 'main', 142);
INSERT INTO public.image VALUES (143, 'https://d2gt6w64qg7rtz.cloudfront.net/products/143-0314d124.webp', 'main', 143);
INSERT INTO public.image VALUES (144, 'https://d2gt6w64qg7rtz.cloudfront.net/products/144-5a10e20e.webp', 'main', 144);
INSERT INTO public.image VALUES (145, 'https://d2gt6w64qg7rtz.cloudfront.net/products/145-ebcdffdb.webp', 'main', 145);
INSERT INTO public.image VALUES (146, 'https://d2gt6w64qg7rtz.cloudfront.net/products/146-111e54d5.webp', 'main', 146);
INSERT INTO public.image VALUES (147, 'https://d2gt6w64qg7rtz.cloudfront.net/products/147-047bdd50.webp', 'main', 147);
INSERT INTO public.image VALUES (148, 'https://d2gt6w64qg7rtz.cloudfront.net/products/148-f8f26f03.webp', 'main', 148);
INSERT INTO public.image VALUES (149, 'https://d2gt6w64qg7rtz.cloudfront.net/products/149-45ebec1f.webp', 'main', 149);
INSERT INTO public.image VALUES (150, 'https://d2gt6w64qg7rtz.cloudfront.net/products/150-625b84de.webp', 'main', 150);
INSERT INTO public.image VALUES (151, 'https://d2gt6w64qg7rtz.cloudfront.net/products/151-167496e0.webp', 'main', 151);
INSERT INTO public.image VALUES (152, 'https://d2gt6w64qg7rtz.cloudfront.net/products/152-f297f414.webp', 'main', 152);
INSERT INTO public.image VALUES (153, 'https://d2gt6w64qg7rtz.cloudfront.net/products/153-35548071.webp', 'main', 153);
INSERT INTO public.image VALUES (154, 'https://d2gt6w64qg7rtz.cloudfront.net/products/154-6b681fb8.webp', 'main', 154);
INSERT INTO public.image VALUES (155, 'https://d2gt6w64qg7rtz.cloudfront.net/products/155-af81ecb2.webp', 'main', 155);
INSERT INTO public.image VALUES (156, 'https://d2gt6w64qg7rtz.cloudfront.net/products/156-dc8ce1bb.webp', 'main', 156);
INSERT INTO public.image VALUES (157, 'https://d2gt6w64qg7rtz.cloudfront.net/products/157-5eac94df.webp', 'main', 157);
INSERT INTO public.image VALUES (158, 'https://d2gt6w64qg7rtz.cloudfront.net/products/158-e49521c0.webp', 'main', 158);
INSERT INTO public.image VALUES (159, 'https://placehold.co/400x400/FFF4EE/F26430?text=Producto+159', 'main', 159);
INSERT INTO public.image VALUES (160, 'https://d2gt6w64qg7rtz.cloudfront.net/products/160-3ae06a6a.webp', 'main', 160);
INSERT INTO public.image VALUES (161, 'https://d2gt6w64qg7rtz.cloudfront.net/products/161-f0098e9d.webp', 'main', 161);
INSERT INTO public.image VALUES (162, 'https://d2gt6w64qg7rtz.cloudfront.net/products/162-25f2d973.webp', 'main', 162);
INSERT INTO public.image VALUES (163, 'https://d2gt6w64qg7rtz.cloudfront.net/products/163-4579573f.webp', 'main', 163);
INSERT INTO public.image VALUES (164, 'https://d2gt6w64qg7rtz.cloudfront.net/products/164-9c56ee83.webp', 'main', 164);
INSERT INTO public.image VALUES (165, 'https://d2gt6w64qg7rtz.cloudfront.net/products/165-c3fb7d5b.webp', 'main', 165);
INSERT INTO public.image VALUES (166, 'https://d2gt6w64qg7rtz.cloudfront.net/products/166-6b92ce6f.webp', 'main', 166);
INSERT INTO public.image VALUES (167, 'https://d2gt6w64qg7rtz.cloudfront.net/products/167-36ce7bae.webp', 'main', 167);
INSERT INTO public.image VALUES (168, 'https://d2gt6w64qg7rtz.cloudfront.net/products/168-eddee4ec.webp', 'main', 168);
INSERT INTO public.image VALUES (169, 'https://d2gt6w64qg7rtz.cloudfront.net/products/169-ed607ba0.webp', 'main', 169);
INSERT INTO public.image VALUES (170, 'https://d2gt6w64qg7rtz.cloudfront.net/products/170-67701bf4.webp', 'main', 170);
INSERT INTO public.image VALUES (171, 'https://d2gt6w64qg7rtz.cloudfront.net/products/171-94fabfa6.webp', 'main', 171);
INSERT INTO public.image VALUES (172, 'https://d2gt6w64qg7rtz.cloudfront.net/products/172-57ed50aa.webp', 'main', 172);
INSERT INTO public.image VALUES (173, 'https://d2gt6w64qg7rtz.cloudfront.net/products/173-c484990e.webp', 'main', 173);
INSERT INTO public.image VALUES (174, 'https://d2gt6w64qg7rtz.cloudfront.net/products/174-b154ad15.webp', 'main', 174);
INSERT INTO public.image VALUES (175, 'https://placehold.co/400x400/FFF4EE/F26430?text=Producto+175', 'main', 175);
INSERT INTO public.image VALUES (176, 'https://d2gt6w64qg7rtz.cloudfront.net/products/176-8a0af93e.webp', 'main', 176);
INSERT INTO public.image VALUES (177, 'https://d2gt6w64qg7rtz.cloudfront.net/products/177-e7236bee.webp', 'main', 177);
INSERT INTO public.image VALUES (178, 'https://d2gt6w64qg7rtz.cloudfront.net/products/178-dd87b104.webp', 'main', 178);
INSERT INTO public.image VALUES (179, 'https://d2gt6w64qg7rtz.cloudfront.net/products/179-4c8ec8a0.webp', 'main', 179);
INSERT INTO public.image VALUES (180, 'https://d2gt6w64qg7rtz.cloudfront.net/products/180-2af5f6c1.webp', 'main', 180);
INSERT INTO public.image VALUES (181, 'https://d2gt6w64qg7rtz.cloudfront.net/products/181-71117154.webp', 'main', 181);
INSERT INTO public.image VALUES (182, 'https://d2gt6w64qg7rtz.cloudfront.net/products/182-30e6a06a.webp', 'main', 182);
INSERT INTO public.image VALUES (183, 'https://d2gt6w64qg7rtz.cloudfront.net/products/183-56235be2.webp', 'main', 183);
INSERT INTO public.image VALUES (184, 'https://d2gt6w64qg7rtz.cloudfront.net/products/184-8288e0e1.webp', 'main', 184);
INSERT INTO public.image VALUES (185, 'https://d2gt6w64qg7rtz.cloudfront.net/products/185-bd8ed4e0.webp', 'main', 185);
INSERT INTO public.image VALUES (186, 'https://d2gt6w64qg7rtz.cloudfront.net/products/186-fca21f7c.webp', 'main', 186);
INSERT INTO public.image VALUES (187, 'https://d2gt6w64qg7rtz.cloudfront.net/products/187-bc1cfe09.webp', 'main', 187);
INSERT INTO public.image VALUES (188, 'https://d2gt6w64qg7rtz.cloudfront.net/products/188-298ec188.webp', 'main', 188);
INSERT INTO public.image VALUES (189, 'https://d2gt6w64qg7rtz.cloudfront.net/products/189-719a0783.webp', 'main', 189);
INSERT INTO public.image VALUES (190, 'https://d2gt6w64qg7rtz.cloudfront.net/products/190-0c0d3110.webp', 'main', 190);
INSERT INTO public.image VALUES (191, 'https://d2gt6w64qg7rtz.cloudfront.net/products/191-67235b4c.webp', 'main', 191);
INSERT INTO public.image VALUES (192, 'https://d2gt6w64qg7rtz.cloudfront.net/products/192-75b949dc.webp', 'main', 192);
INSERT INTO public.image VALUES (193, 'https://d2gt6w64qg7rtz.cloudfront.net/products/193-3c7969b7.webp', 'main', 193);
INSERT INTO public.image VALUES (194, 'https://d2gt6w64qg7rtz.cloudfront.net/products/194-836be773.webp', 'main', 194);
INSERT INTO public.image VALUES (195, 'https://d2gt6w64qg7rtz.cloudfront.net/products/195-724a9038.webp', 'main', 195);
INSERT INTO public.image VALUES (196, 'https://d2gt6w64qg7rtz.cloudfront.net/products/196-2a6f327a.webp', 'main', 196);
INSERT INTO public.image VALUES (197, 'https://d2gt6w64qg7rtz.cloudfront.net/products/197-e0904479.webp', 'main', 197);
INSERT INTO public.image VALUES (198, 'https://d2gt6w64qg7rtz.cloudfront.net/products/198-c6bd4ce8.webp', 'main', 198);
INSERT INTO public.image VALUES (199, 'https://d2gt6w64qg7rtz.cloudfront.net/products/199-898b4c94.webp', 'main', 199);
INSERT INTO public.image VALUES (200, 'https://d2gt6w64qg7rtz.cloudfront.net/products/200-d1fa8685.webp', 'main', 200);
INSERT INTO public.image VALUES (201, 'https://d2gt6w64qg7rtz.cloudfront.net/products/201-66737c8b.webp', 'main', 201);
INSERT INTO public.image VALUES (202, 'https://d2gt6w64qg7rtz.cloudfront.net/products/202-e16c14a0.webp', 'main', 202);
INSERT INTO public.image VALUES (203, 'https://d2gt6w64qg7rtz.cloudfront.net/products/203-64026751.webp', 'main', 203);
INSERT INTO public.image VALUES (204, 'https://d2gt6w64qg7rtz.cloudfront.net/products/204-b7cee18c.webp', 'main', 204);
INSERT INTO public.image VALUES (205, 'https://d2gt6w64qg7rtz.cloudfront.net/products/205-62518385.webp', 'main', 205);
INSERT INTO public.image VALUES (206, 'https://d2gt6w64qg7rtz.cloudfront.net/products/206-ad53a03a.webp', 'main', 206);
INSERT INTO public.image VALUES (207, 'https://d2gt6w64qg7rtz.cloudfront.net/products/207-43a00b12.webp', 'main', 207);
INSERT INTO public.image VALUES (208, 'https://d2gt6w64qg7rtz.cloudfront.net/products/208-694ba42c.webp', 'main', 208);
INSERT INTO public.image VALUES (209, 'https://d2gt6w64qg7rtz.cloudfront.net/products/209-17d16c24.webp', 'main', 209);
INSERT INTO public.image VALUES (210, 'https://d2gt6w64qg7rtz.cloudfront.net/products/210-d23d39b8.webp', 'main', 210);
INSERT INTO public.image VALUES (211, 'https://dcuk1cxrnzjkh.cloudfront.net/imagesproducto/035797L.jpg', 'main', 211);
INSERT INTO public.image VALUES (212, 'https://dcuk1cxrnzjkh.cloudfront.net/imagesproducto/012498L.jpg', 'main', 212);
INSERT INTO public.image VALUES (213, 'https://dcuk1cxrnzjkh.cloudfront.net/imagesproducto/071188L.jpg', 'main', 213);
INSERT INTO public.image VALUES (214, 'https://dcuk1cxrnzjkh.cloudfront.net/imagesproducto/037509L.jpg', 'main', 214);
INSERT INTO public.image VALUES (215, 'https://d2mipljaww8tb4.cloudfront.net/mia_imagenes/074120L.jpg', 'main', 215);
INSERT INTO public.image VALUES (216, 'https://d2mipljaww8tb4.cloudfront.net/mia_imagenes/016888L.jpg', 'main', 216);
INSERT INTO public.image VALUES (217, 'https://cloudinary.images-iherb.com/image/upload/f_auto,q_auto:eco/images/nrt/nrt13430/v/44.jpg', 'main', 217);
INSERT INTO public.image VALUES (218, 'https://dcuk1cxrnzjkh.cloudfront.net/imagesproducto/037770L.jpg', 'main', 218);
INSERT INTO public.image VALUES (219, 'https://cloudinary.images-iherb.com/image/upload/f_auto,q_auto:eco/images/sol/sol01788/v/101.jpg', 'main', 219);
INSERT INTO public.image VALUES (220, 'https://media.falabella.com/falabellaPE/152927096_01/w=1200,h=1200,fit=pad', 'main', 220);


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.inventory VALUES (2, 25, 10, 1, 2);
INSERT INTO public.inventory VALUES (4, 15, 10, 2, 2);
INSERT INTO public.inventory VALUES (5, 25, 10, 3, 1);
INSERT INTO public.inventory VALUES (6, 10, 10, 3, 2);
INSERT INTO public.inventory VALUES (7, 80, 10, 4, 1);
INSERT INTO public.inventory VALUES (8, 40, 10, 4, 2);
INSERT INTO public.inventory VALUES (9, 50, 10, 5, 1);
INSERT INTO public.inventory VALUES (10, 25, 10, 5, 2);
INSERT INTO public.inventory VALUES (11, 35, 10, 6, 1);
INSERT INTO public.inventory VALUES (12, 15, 10, 6, 2);
INSERT INTO public.inventory VALUES (13, 25, 10, 7, 1);
INSERT INTO public.inventory VALUES (14, 10, 10, 7, 2);
INSERT INTO public.inventory VALUES (15, 80, 10, 8, 1);
INSERT INTO public.inventory VALUES (16, 40, 10, 8, 2);
INSERT INTO public.inventory VALUES (17, 50, 10, 9, 1);
INSERT INTO public.inventory VALUES (18, 25, 10, 9, 2);
INSERT INTO public.inventory VALUES (19, 35, 10, 10, 1);
INSERT INTO public.inventory VALUES (20, 15, 10, 10, 2);
INSERT INTO public.inventory VALUES (21, 25, 10, 11, 1);
INSERT INTO public.inventory VALUES (22, 10, 10, 11, 2);
INSERT INTO public.inventory VALUES (23, 80, 10, 12, 1);
INSERT INTO public.inventory VALUES (24, 40, 10, 12, 2);
INSERT INTO public.inventory VALUES (25, 50, 10, 13, 1);
INSERT INTO public.inventory VALUES (26, 25, 10, 13, 2);
INSERT INTO public.inventory VALUES (27, 35, 10, 14, 1);
INSERT INTO public.inventory VALUES (28, 15, 10, 14, 2);
INSERT INTO public.inventory VALUES (29, 25, 10, 15, 1);
INSERT INTO public.inventory VALUES (30, 10, 10, 15, 2);
INSERT INTO public.inventory VALUES (31, 80, 10, 16, 1);
INSERT INTO public.inventory VALUES (32, 40, 10, 16, 2);
INSERT INTO public.inventory VALUES (33, 50, 10, 17, 1);
INSERT INTO public.inventory VALUES (34, 25, 10, 17, 2);
INSERT INTO public.inventory VALUES (35, 35, 10, 18, 1);
INSERT INTO public.inventory VALUES (36, 15, 10, 18, 2);
INSERT INTO public.inventory VALUES (37, 25, 10, 19, 1);
INSERT INTO public.inventory VALUES (38, 10, 10, 19, 2);
INSERT INTO public.inventory VALUES (39, 80, 10, 20, 1);
INSERT INTO public.inventory VALUES (40, 40, 10, 20, 2);
INSERT INTO public.inventory VALUES (41, 50, 10, 21, 1);
INSERT INTO public.inventory VALUES (42, 25, 10, 21, 2);
INSERT INTO public.inventory VALUES (43, 35, 10, 22, 1);
INSERT INTO public.inventory VALUES (44, 15, 10, 22, 2);
INSERT INTO public.inventory VALUES (45, 25, 10, 23, 1);
INSERT INTO public.inventory VALUES (46, 10, 10, 23, 2);
INSERT INTO public.inventory VALUES (47, 80, 10, 24, 1);
INSERT INTO public.inventory VALUES (48, 40, 10, 24, 2);
INSERT INTO public.inventory VALUES (49, 50, 10, 25, 1);
INSERT INTO public.inventory VALUES (50, 25, 10, 25, 2);
INSERT INTO public.inventory VALUES (51, 35, 10, 26, 1);
INSERT INTO public.inventory VALUES (52, 15, 10, 26, 2);
INSERT INTO public.inventory VALUES (53, 25, 10, 27, 1);
INSERT INTO public.inventory VALUES (54, 10, 10, 27, 2);
INSERT INTO public.inventory VALUES (55, 80, 10, 28, 1);
INSERT INTO public.inventory VALUES (56, 40, 10, 28, 2);
INSERT INTO public.inventory VALUES (57, 50, 10, 29, 1);
INSERT INTO public.inventory VALUES (58, 25, 10, 29, 2);
INSERT INTO public.inventory VALUES (59, 35, 10, 30, 1);
INSERT INTO public.inventory VALUES (60, 15, 10, 30, 2);
INSERT INTO public.inventory VALUES (61, 25, 10, 31, 1);
INSERT INTO public.inventory VALUES (62, 10, 10, 31, 2);
INSERT INTO public.inventory VALUES (63, 80, 10, 32, 1);
INSERT INTO public.inventory VALUES (64, 40, 10, 32, 2);
INSERT INTO public.inventory VALUES (65, 50, 10, 33, 1);
INSERT INTO public.inventory VALUES (66, 25, 10, 33, 2);
INSERT INTO public.inventory VALUES (67, 35, 10, 34, 1);
INSERT INTO public.inventory VALUES (68, 15, 10, 34, 2);
INSERT INTO public.inventory VALUES (69, 25, 10, 35, 1);
INSERT INTO public.inventory VALUES (70, 10, 10, 35, 2);
INSERT INTO public.inventory VALUES (71, 80, 10, 36, 1);
INSERT INTO public.inventory VALUES (72, 40, 10, 36, 2);
INSERT INTO public.inventory VALUES (73, 50, 10, 37, 1);
INSERT INTO public.inventory VALUES (74, 25, 10, 37, 2);
INSERT INTO public.inventory VALUES (75, 35, 10, 38, 1);
INSERT INTO public.inventory VALUES (76, 15, 10, 38, 2);
INSERT INTO public.inventory VALUES (77, 25, 10, 39, 1);
INSERT INTO public.inventory VALUES (78, 10, 10, 39, 2);
INSERT INTO public.inventory VALUES (79, 80, 10, 40, 1);
INSERT INTO public.inventory VALUES (80, 40, 10, 40, 2);
INSERT INTO public.inventory VALUES (81, 50, 10, 41, 1);
INSERT INTO public.inventory VALUES (82, 25, 10, 41, 2);
INSERT INTO public.inventory VALUES (83, 35, 10, 42, 1);
INSERT INTO public.inventory VALUES (84, 15, 10, 42, 2);
INSERT INTO public.inventory VALUES (85, 25, 10, 43, 1);
INSERT INTO public.inventory VALUES (86, 10, 10, 43, 2);
INSERT INTO public.inventory VALUES (87, 80, 10, 44, 1);
INSERT INTO public.inventory VALUES (88, 40, 10, 44, 2);
INSERT INTO public.inventory VALUES (89, 50, 10, 45, 1);
INSERT INTO public.inventory VALUES (90, 25, 10, 45, 2);
INSERT INTO public.inventory VALUES (91, 35, 10, 46, 1);
INSERT INTO public.inventory VALUES (92, 15, 10, 46, 2);
INSERT INTO public.inventory VALUES (93, 25, 10, 47, 1);
INSERT INTO public.inventory VALUES (94, 10, 10, 47, 2);
INSERT INTO public.inventory VALUES (95, 80, 10, 48, 1);
INSERT INTO public.inventory VALUES (96, 40, 10, 48, 2);
INSERT INTO public.inventory VALUES (97, 50, 10, 49, 1);
INSERT INTO public.inventory VALUES (98, 25, 10, 49, 2);
INSERT INTO public.inventory VALUES (99, 35, 10, 50, 1);
INSERT INTO public.inventory VALUES (100, 15, 10, 50, 2);
INSERT INTO public.inventory VALUES (101, 25, 10, 51, 1);
INSERT INTO public.inventory VALUES (102, 10, 10, 51, 2);
INSERT INTO public.inventory VALUES (103, 80, 10, 52, 1);
INSERT INTO public.inventory VALUES (104, 40, 10, 52, 2);
INSERT INTO public.inventory VALUES (105, 50, 10, 53, 1);
INSERT INTO public.inventory VALUES (106, 25, 10, 53, 2);
INSERT INTO public.inventory VALUES (107, 35, 10, 54, 1);
INSERT INTO public.inventory VALUES (108, 15, 10, 54, 2);
INSERT INTO public.inventory VALUES (109, 25, 10, 55, 1);
INSERT INTO public.inventory VALUES (110, 10, 10, 55, 2);
INSERT INTO public.inventory VALUES (111, 80, 10, 56, 1);
INSERT INTO public.inventory VALUES (112, 40, 10, 56, 2);
INSERT INTO public.inventory VALUES (113, 50, 10, 57, 1);
INSERT INTO public.inventory VALUES (114, 25, 10, 57, 2);
INSERT INTO public.inventory VALUES (115, 35, 10, 58, 1);
INSERT INTO public.inventory VALUES (116, 15, 10, 58, 2);
INSERT INTO public.inventory VALUES (117, 25, 10, 59, 1);
INSERT INTO public.inventory VALUES (118, 10, 10, 59, 2);
INSERT INTO public.inventory VALUES (119, 80, 10, 60, 1);
INSERT INTO public.inventory VALUES (120, 40, 10, 60, 2);
INSERT INTO public.inventory VALUES (121, 50, 10, 61, 1);
INSERT INTO public.inventory VALUES (122, 25, 10, 61, 2);
INSERT INTO public.inventory VALUES (123, 35, 10, 62, 1);
INSERT INTO public.inventory VALUES (124, 15, 10, 62, 2);
INSERT INTO public.inventory VALUES (125, 25, 10, 63, 1);
INSERT INTO public.inventory VALUES (126, 10, 10, 63, 2);
INSERT INTO public.inventory VALUES (127, 80, 10, 64, 1);
INSERT INTO public.inventory VALUES (128, 40, 10, 64, 2);
INSERT INTO public.inventory VALUES (129, 50, 10, 65, 1);
INSERT INTO public.inventory VALUES (130, 25, 10, 65, 2);
INSERT INTO public.inventory VALUES (131, 35, 10, 66, 1);
INSERT INTO public.inventory VALUES (132, 15, 10, 66, 2);
INSERT INTO public.inventory VALUES (133, 25, 10, 67, 1);
INSERT INTO public.inventory VALUES (134, 10, 10, 67, 2);
INSERT INTO public.inventory VALUES (135, 80, 10, 68, 1);
INSERT INTO public.inventory VALUES (136, 40, 10, 68, 2);
INSERT INTO public.inventory VALUES (137, 50, 10, 69, 1);
INSERT INTO public.inventory VALUES (138, 25, 10, 69, 2);
INSERT INTO public.inventory VALUES (139, 35, 10, 70, 1);
INSERT INTO public.inventory VALUES (140, 15, 10, 70, 2);
INSERT INTO public.inventory VALUES (141, 25, 10, 71, 1);
INSERT INTO public.inventory VALUES (142, 10, 10, 71, 2);
INSERT INTO public.inventory VALUES (143, 80, 10, 72, 1);
INSERT INTO public.inventory VALUES (144, 40, 10, 72, 2);
INSERT INTO public.inventory VALUES (145, 50, 10, 73, 1);
INSERT INTO public.inventory VALUES (146, 25, 10, 73, 2);
INSERT INTO public.inventory VALUES (147, 35, 10, 74, 1);
INSERT INTO public.inventory VALUES (148, 15, 10, 74, 2);
INSERT INTO public.inventory VALUES (149, 25, 10, 75, 1);
INSERT INTO public.inventory VALUES (150, 10, 10, 75, 2);
INSERT INTO public.inventory VALUES (151, 80, 10, 76, 1);
INSERT INTO public.inventory VALUES (152, 40, 10, 76, 2);
INSERT INTO public.inventory VALUES (153, 50, 10, 77, 1);
INSERT INTO public.inventory VALUES (154, 25, 10, 77, 2);
INSERT INTO public.inventory VALUES (155, 35, 10, 78, 1);
INSERT INTO public.inventory VALUES (156, 15, 10, 78, 2);
INSERT INTO public.inventory VALUES (157, 25, 10, 79, 1);
INSERT INTO public.inventory VALUES (1, 49, 10, 1, 1);
INSERT INTO public.inventory VALUES (158, 10, 10, 79, 2);
INSERT INTO public.inventory VALUES (159, 80, 10, 80, 1);
INSERT INTO public.inventory VALUES (160, 40, 10, 80, 2);
INSERT INTO public.inventory VALUES (161, 50, 10, 81, 1);
INSERT INTO public.inventory VALUES (162, 25, 10, 81, 2);
INSERT INTO public.inventory VALUES (163, 35, 10, 82, 1);
INSERT INTO public.inventory VALUES (164, 15, 10, 82, 2);
INSERT INTO public.inventory VALUES (165, 25, 10, 83, 1);
INSERT INTO public.inventory VALUES (166, 10, 10, 83, 2);
INSERT INTO public.inventory VALUES (167, 80, 10, 84, 1);
INSERT INTO public.inventory VALUES (168, 40, 10, 84, 2);
INSERT INTO public.inventory VALUES (169, 50, 10, 85, 1);
INSERT INTO public.inventory VALUES (170, 25, 10, 85, 2);
INSERT INTO public.inventory VALUES (171, 35, 10, 86, 1);
INSERT INTO public.inventory VALUES (172, 15, 10, 86, 2);
INSERT INTO public.inventory VALUES (173, 25, 10, 87, 1);
INSERT INTO public.inventory VALUES (174, 10, 10, 87, 2);
INSERT INTO public.inventory VALUES (175, 80, 10, 88, 1);
INSERT INTO public.inventory VALUES (176, 40, 10, 88, 2);
INSERT INTO public.inventory VALUES (177, 50, 10, 89, 1);
INSERT INTO public.inventory VALUES (178, 25, 10, 89, 2);
INSERT INTO public.inventory VALUES (179, 35, 10, 90, 1);
INSERT INTO public.inventory VALUES (180, 15, 10, 90, 2);
INSERT INTO public.inventory VALUES (181, 25, 10, 91, 1);
INSERT INTO public.inventory VALUES (182, 10, 10, 91, 2);
INSERT INTO public.inventory VALUES (183, 80, 10, 92, 1);
INSERT INTO public.inventory VALUES (184, 40, 10, 92, 2);
INSERT INTO public.inventory VALUES (185, 50, 10, 93, 1);
INSERT INTO public.inventory VALUES (186, 25, 10, 93, 2);
INSERT INTO public.inventory VALUES (187, 35, 10, 94, 1);
INSERT INTO public.inventory VALUES (188, 15, 10, 94, 2);
INSERT INTO public.inventory VALUES (189, 25, 10, 95, 1);
INSERT INTO public.inventory VALUES (190, 10, 10, 95, 2);
INSERT INTO public.inventory VALUES (191, 80, 10, 96, 1);
INSERT INTO public.inventory VALUES (192, 40, 10, 96, 2);
INSERT INTO public.inventory VALUES (193, 50, 10, 97, 1);
INSERT INTO public.inventory VALUES (194, 25, 10, 97, 2);
INSERT INTO public.inventory VALUES (195, 35, 10, 98, 1);
INSERT INTO public.inventory VALUES (196, 15, 10, 98, 2);
INSERT INTO public.inventory VALUES (197, 25, 10, 99, 1);
INSERT INTO public.inventory VALUES (198, 10, 10, 99, 2);
INSERT INTO public.inventory VALUES (199, 80, 10, 100, 1);
INSERT INTO public.inventory VALUES (200, 40, 10, 100, 2);
INSERT INTO public.inventory VALUES (201, 50, 10, 101, 1);
INSERT INTO public.inventory VALUES (202, 25, 10, 101, 2);
INSERT INTO public.inventory VALUES (203, 35, 10, 102, 1);
INSERT INTO public.inventory VALUES (204, 15, 10, 102, 2);
INSERT INTO public.inventory VALUES (205, 25, 10, 103, 1);
INSERT INTO public.inventory VALUES (206, 10, 10, 103, 2);
INSERT INTO public.inventory VALUES (207, 80, 10, 104, 1);
INSERT INTO public.inventory VALUES (208, 40, 10, 104, 2);
INSERT INTO public.inventory VALUES (209, 50, 10, 105, 1);
INSERT INTO public.inventory VALUES (210, 25, 10, 105, 2);
INSERT INTO public.inventory VALUES (211, 35, 10, 106, 1);
INSERT INTO public.inventory VALUES (212, 15, 10, 106, 2);
INSERT INTO public.inventory VALUES (213, 25, 10, 107, 1);
INSERT INTO public.inventory VALUES (214, 10, 10, 107, 2);
INSERT INTO public.inventory VALUES (215, 80, 10, 108, 1);
INSERT INTO public.inventory VALUES (216, 40, 10, 108, 2);
INSERT INTO public.inventory VALUES (217, 50, 10, 109, 1);
INSERT INTO public.inventory VALUES (218, 25, 10, 109, 2);
INSERT INTO public.inventory VALUES (219, 35, 10, 110, 1);
INSERT INTO public.inventory VALUES (220, 15, 10, 110, 2);
INSERT INTO public.inventory VALUES (221, 25, 10, 111, 1);
INSERT INTO public.inventory VALUES (222, 10, 10, 111, 2);
INSERT INTO public.inventory VALUES (223, 80, 10, 112, 1);
INSERT INTO public.inventory VALUES (224, 40, 10, 112, 2);
INSERT INTO public.inventory VALUES (225, 50, 10, 113, 1);
INSERT INTO public.inventory VALUES (226, 25, 10, 113, 2);
INSERT INTO public.inventory VALUES (227, 35, 10, 114, 1);
INSERT INTO public.inventory VALUES (228, 15, 10, 114, 2);
INSERT INTO public.inventory VALUES (229, 25, 10, 115, 1);
INSERT INTO public.inventory VALUES (230, 10, 10, 115, 2);
INSERT INTO public.inventory VALUES (231, 80, 10, 116, 1);
INSERT INTO public.inventory VALUES (232, 40, 10, 116, 2);
INSERT INTO public.inventory VALUES (233, 50, 10, 117, 1);
INSERT INTO public.inventory VALUES (234, 25, 10, 117, 2);
INSERT INTO public.inventory VALUES (235, 35, 10, 118, 1);
INSERT INTO public.inventory VALUES (236, 15, 10, 118, 2);
INSERT INTO public.inventory VALUES (237, 25, 10, 119, 1);
INSERT INTO public.inventory VALUES (238, 10, 10, 119, 2);
INSERT INTO public.inventory VALUES (239, 80, 10, 120, 1);
INSERT INTO public.inventory VALUES (240, 40, 10, 120, 2);
INSERT INTO public.inventory VALUES (241, 50, 10, 121, 1);
INSERT INTO public.inventory VALUES (242, 25, 10, 121, 2);
INSERT INTO public.inventory VALUES (243, 35, 10, 122, 1);
INSERT INTO public.inventory VALUES (244, 15, 10, 122, 2);
INSERT INTO public.inventory VALUES (245, 25, 10, 123, 1);
INSERT INTO public.inventory VALUES (246, 10, 10, 123, 2);
INSERT INTO public.inventory VALUES (247, 80, 10, 124, 1);
INSERT INTO public.inventory VALUES (248, 40, 10, 124, 2);
INSERT INTO public.inventory VALUES (249, 50, 10, 125, 1);
INSERT INTO public.inventory VALUES (250, 25, 10, 125, 2);
INSERT INTO public.inventory VALUES (251, 35, 10, 126, 1);
INSERT INTO public.inventory VALUES (252, 15, 10, 126, 2);
INSERT INTO public.inventory VALUES (253, 25, 10, 127, 1);
INSERT INTO public.inventory VALUES (254, 10, 10, 127, 2);
INSERT INTO public.inventory VALUES (255, 80, 10, 128, 1);
INSERT INTO public.inventory VALUES (256, 40, 10, 128, 2);
INSERT INTO public.inventory VALUES (257, 50, 10, 129, 1);
INSERT INTO public.inventory VALUES (258, 25, 10, 129, 2);
INSERT INTO public.inventory VALUES (259, 35, 10, 130, 1);
INSERT INTO public.inventory VALUES (260, 15, 10, 130, 2);
INSERT INTO public.inventory VALUES (261, 25, 10, 131, 1);
INSERT INTO public.inventory VALUES (262, 10, 10, 131, 2);
INSERT INTO public.inventory VALUES (263, 80, 10, 132, 1);
INSERT INTO public.inventory VALUES (264, 40, 10, 132, 2);
INSERT INTO public.inventory VALUES (265, 50, 10, 133, 1);
INSERT INTO public.inventory VALUES (266, 25, 10, 133, 2);
INSERT INTO public.inventory VALUES (267, 35, 10, 134, 1);
INSERT INTO public.inventory VALUES (268, 15, 10, 134, 2);
INSERT INTO public.inventory VALUES (269, 25, 10, 135, 1);
INSERT INTO public.inventory VALUES (270, 10, 10, 135, 2);
INSERT INTO public.inventory VALUES (271, 80, 10, 136, 1);
INSERT INTO public.inventory VALUES (272, 40, 10, 136, 2);
INSERT INTO public.inventory VALUES (273, 50, 10, 137, 1);
INSERT INTO public.inventory VALUES (274, 25, 10, 137, 2);
INSERT INTO public.inventory VALUES (275, 35, 10, 138, 1);
INSERT INTO public.inventory VALUES (276, 15, 10, 138, 2);
INSERT INTO public.inventory VALUES (277, 25, 10, 139, 1);
INSERT INTO public.inventory VALUES (278, 10, 10, 139, 2);
INSERT INTO public.inventory VALUES (279, 80, 10, 140, 1);
INSERT INTO public.inventory VALUES (280, 40, 10, 140, 2);
INSERT INTO public.inventory VALUES (281, 50, 10, 141, 1);
INSERT INTO public.inventory VALUES (282, 25, 10, 141, 2);
INSERT INTO public.inventory VALUES (283, 35, 10, 142, 1);
INSERT INTO public.inventory VALUES (284, 15, 10, 142, 2);
INSERT INTO public.inventory VALUES (285, 25, 10, 143, 1);
INSERT INTO public.inventory VALUES (286, 10, 10, 143, 2);
INSERT INTO public.inventory VALUES (287, 80, 10, 144, 1);
INSERT INTO public.inventory VALUES (288, 40, 10, 144, 2);
INSERT INTO public.inventory VALUES (289, 50, 10, 145, 1);
INSERT INTO public.inventory VALUES (290, 25, 10, 145, 2);
INSERT INTO public.inventory VALUES (291, 35, 10, 146, 1);
INSERT INTO public.inventory VALUES (292, 15, 10, 146, 2);
INSERT INTO public.inventory VALUES (293, 25, 10, 147, 1);
INSERT INTO public.inventory VALUES (294, 10, 10, 147, 2);
INSERT INTO public.inventory VALUES (295, 80, 10, 148, 1);
INSERT INTO public.inventory VALUES (296, 40, 10, 148, 2);
INSERT INTO public.inventory VALUES (297, 50, 10, 149, 1);
INSERT INTO public.inventory VALUES (298, 25, 10, 149, 2);
INSERT INTO public.inventory VALUES (299, 35, 10, 150, 1);
INSERT INTO public.inventory VALUES (300, 15, 10, 150, 2);
INSERT INTO public.inventory VALUES (301, 25, 10, 151, 1);
INSERT INTO public.inventory VALUES (302, 10, 10, 151, 2);
INSERT INTO public.inventory VALUES (303, 80, 10, 152, 1);
INSERT INTO public.inventory VALUES (304, 40, 10, 152, 2);
INSERT INTO public.inventory VALUES (305, 50, 10, 153, 1);
INSERT INTO public.inventory VALUES (306, 25, 10, 153, 2);
INSERT INTO public.inventory VALUES (307, 35, 10, 154, 1);
INSERT INTO public.inventory VALUES (308, 15, 10, 154, 2);
INSERT INTO public.inventory VALUES (309, 25, 10, 155, 1);
INSERT INTO public.inventory VALUES (310, 10, 10, 155, 2);
INSERT INTO public.inventory VALUES (311, 80, 10, 156, 1);
INSERT INTO public.inventory VALUES (312, 40, 10, 156, 2);
INSERT INTO public.inventory VALUES (313, 50, 10, 157, 1);
INSERT INTO public.inventory VALUES (314, 25, 10, 157, 2);
INSERT INTO public.inventory VALUES (315, 35, 10, 158, 1);
INSERT INTO public.inventory VALUES (316, 15, 10, 158, 2);
INSERT INTO public.inventory VALUES (317, 25, 10, 159, 1);
INSERT INTO public.inventory VALUES (318, 10, 10, 159, 2);
INSERT INTO public.inventory VALUES (319, 80, 10, 160, 1);
INSERT INTO public.inventory VALUES (320, 40, 10, 160, 2);
INSERT INTO public.inventory VALUES (321, 50, 10, 161, 1);
INSERT INTO public.inventory VALUES (322, 25, 10, 161, 2);
INSERT INTO public.inventory VALUES (323, 35, 10, 162, 1);
INSERT INTO public.inventory VALUES (324, 15, 10, 162, 2);
INSERT INTO public.inventory VALUES (325, 25, 10, 163, 1);
INSERT INTO public.inventory VALUES (326, 10, 10, 163, 2);
INSERT INTO public.inventory VALUES (327, 80, 10, 164, 1);
INSERT INTO public.inventory VALUES (328, 40, 10, 164, 2);
INSERT INTO public.inventory VALUES (329, 50, 10, 165, 1);
INSERT INTO public.inventory VALUES (330, 25, 10, 165, 2);
INSERT INTO public.inventory VALUES (331, 35, 10, 166, 1);
INSERT INTO public.inventory VALUES (332, 15, 10, 166, 2);
INSERT INTO public.inventory VALUES (333, 25, 10, 167, 1);
INSERT INTO public.inventory VALUES (334, 10, 10, 167, 2);
INSERT INTO public.inventory VALUES (335, 80, 10, 168, 1);
INSERT INTO public.inventory VALUES (336, 40, 10, 168, 2);
INSERT INTO public.inventory VALUES (337, 50, 10, 169, 1);
INSERT INTO public.inventory VALUES (338, 25, 10, 169, 2);
INSERT INTO public.inventory VALUES (339, 35, 10, 170, 1);
INSERT INTO public.inventory VALUES (340, 15, 10, 170, 2);
INSERT INTO public.inventory VALUES (341, 25, 10, 171, 1);
INSERT INTO public.inventory VALUES (342, 10, 10, 171, 2);
INSERT INTO public.inventory VALUES (343, 80, 10, 172, 1);
INSERT INTO public.inventory VALUES (344, 40, 10, 172, 2);
INSERT INTO public.inventory VALUES (345, 50, 10, 173, 1);
INSERT INTO public.inventory VALUES (346, 25, 10, 173, 2);
INSERT INTO public.inventory VALUES (347, 35, 10, 174, 1);
INSERT INTO public.inventory VALUES (348, 15, 10, 174, 2);
INSERT INTO public.inventory VALUES (349, 25, 10, 175, 1);
INSERT INTO public.inventory VALUES (350, 10, 10, 175, 2);
INSERT INTO public.inventory VALUES (351, 80, 10, 176, 1);
INSERT INTO public.inventory VALUES (352, 40, 10, 176, 2);
INSERT INTO public.inventory VALUES (353, 50, 10, 177, 1);
INSERT INTO public.inventory VALUES (354, 25, 10, 177, 2);
INSERT INTO public.inventory VALUES (355, 35, 10, 178, 1);
INSERT INTO public.inventory VALUES (356, 15, 10, 178, 2);
INSERT INTO public.inventory VALUES (357, 25, 10, 179, 1);
INSERT INTO public.inventory VALUES (358, 10, 10, 179, 2);
INSERT INTO public.inventory VALUES (359, 80, 10, 180, 1);
INSERT INTO public.inventory VALUES (360, 40, 10, 180, 2);
INSERT INTO public.inventory VALUES (361, 50, 10, 181, 1);
INSERT INTO public.inventory VALUES (362, 25, 10, 181, 2);
INSERT INTO public.inventory VALUES (363, 35, 10, 182, 1);
INSERT INTO public.inventory VALUES (364, 15, 10, 182, 2);
INSERT INTO public.inventory VALUES (365, 25, 10, 183, 1);
INSERT INTO public.inventory VALUES (366, 10, 10, 183, 2);
INSERT INTO public.inventory VALUES (367, 80, 10, 184, 1);
INSERT INTO public.inventory VALUES (368, 40, 10, 184, 2);
INSERT INTO public.inventory VALUES (369, 50, 10, 185, 1);
INSERT INTO public.inventory VALUES (370, 25, 10, 185, 2);
INSERT INTO public.inventory VALUES (371, 35, 10, 186, 1);
INSERT INTO public.inventory VALUES (372, 15, 10, 186, 2);
INSERT INTO public.inventory VALUES (373, 25, 10, 187, 1);
INSERT INTO public.inventory VALUES (374, 10, 10, 187, 2);
INSERT INTO public.inventory VALUES (375, 80, 10, 188, 1);
INSERT INTO public.inventory VALUES (376, 40, 10, 188, 2);
INSERT INTO public.inventory VALUES (377, 50, 10, 189, 1);
INSERT INTO public.inventory VALUES (378, 25, 10, 189, 2);
INSERT INTO public.inventory VALUES (379, 35, 10, 190, 1);
INSERT INTO public.inventory VALUES (380, 15, 10, 190, 2);
INSERT INTO public.inventory VALUES (381, 25, 10, 191, 1);
INSERT INTO public.inventory VALUES (382, 10, 10, 191, 2);
INSERT INTO public.inventory VALUES (383, 80, 10, 192, 1);
INSERT INTO public.inventory VALUES (384, 40, 10, 192, 2);
INSERT INTO public.inventory VALUES (385, 50, 10, 193, 1);
INSERT INTO public.inventory VALUES (386, 25, 10, 193, 2);
INSERT INTO public.inventory VALUES (387, 35, 10, 194, 1);
INSERT INTO public.inventory VALUES (388, 15, 10, 194, 2);
INSERT INTO public.inventory VALUES (389, 25, 10, 195, 1);
INSERT INTO public.inventory VALUES (390, 10, 10, 195, 2);
INSERT INTO public.inventory VALUES (391, 80, 10, 196, 1);
INSERT INTO public.inventory VALUES (392, 40, 10, 196, 2);
INSERT INTO public.inventory VALUES (393, 50, 10, 197, 1);
INSERT INTO public.inventory VALUES (394, 25, 10, 197, 2);
INSERT INTO public.inventory VALUES (395, 35, 10, 198, 1);
INSERT INTO public.inventory VALUES (396, 15, 10, 198, 2);
INSERT INTO public.inventory VALUES (397, 25, 10, 199, 1);
INSERT INTO public.inventory VALUES (398, 10, 10, 199, 2);
INSERT INTO public.inventory VALUES (399, 80, 10, 200, 1);
INSERT INTO public.inventory VALUES (400, 40, 10, 200, 2);
INSERT INTO public.inventory VALUES (401, 50, 10, 201, 1);
INSERT INTO public.inventory VALUES (402, 25, 10, 201, 2);
INSERT INTO public.inventory VALUES (403, 35, 10, 202, 1);
INSERT INTO public.inventory VALUES (404, 15, 10, 202, 2);
INSERT INTO public.inventory VALUES (405, 25, 10, 203, 1);
INSERT INTO public.inventory VALUES (406, 10, 10, 203, 2);
INSERT INTO public.inventory VALUES (407, 80, 10, 204, 1);
INSERT INTO public.inventory VALUES (408, 40, 10, 204, 2);
INSERT INTO public.inventory VALUES (409, 50, 10, 205, 1);
INSERT INTO public.inventory VALUES (410, 25, 10, 205, 2);
INSERT INTO public.inventory VALUES (411, 35, 10, 206, 1);
INSERT INTO public.inventory VALUES (412, 15, 10, 206, 2);
INSERT INTO public.inventory VALUES (413, 25, 10, 207, 1);
INSERT INTO public.inventory VALUES (414, 10, 10, 207, 2);
INSERT INTO public.inventory VALUES (415, 80, 10, 208, 1);
INSERT INTO public.inventory VALUES (416, 40, 10, 208, 2);
INSERT INTO public.inventory VALUES (417, 50, 10, 209, 1);
INSERT INTO public.inventory VALUES (418, 25, 10, 209, 2);
INSERT INTO public.inventory VALUES (419, 35, 10, 210, 1);
INSERT INTO public.inventory VALUES (420, 15, 10, 210, 2);
INSERT INTO public.inventory VALUES (421, 25, 10, 211, 1);
INSERT INTO public.inventory VALUES (422, 10, 10, 211, 2);
INSERT INTO public.inventory VALUES (423, 80, 10, 212, 1);
INSERT INTO public.inventory VALUES (424, 40, 10, 212, 2);
INSERT INTO public.inventory VALUES (425, 50, 10, 213, 1);
INSERT INTO public.inventory VALUES (426, 25, 10, 213, 2);
INSERT INTO public.inventory VALUES (427, 35, 10, 214, 1);
INSERT INTO public.inventory VALUES (428, 15, 10, 214, 2);
INSERT INTO public.inventory VALUES (429, 25, 10, 215, 1);
INSERT INTO public.inventory VALUES (430, 10, 10, 215, 2);
INSERT INTO public.inventory VALUES (431, 80, 10, 216, 1);
INSERT INTO public.inventory VALUES (432, 40, 10, 216, 2);
INSERT INTO public.inventory VALUES (433, 50, 10, 217, 1);
INSERT INTO public.inventory VALUES (434, 25, 10, 217, 2);
INSERT INTO public.inventory VALUES (435, 35, 10, 218, 1);
INSERT INTO public.inventory VALUES (436, 15, 10, 218, 2);
INSERT INTO public.inventory VALUES (437, 25, 10, 219, 1);
INSERT INTO public.inventory VALUES (438, 10, 10, 219, 2);
INSERT INTO public.inventory VALUES (439, 80, 10, 220, 1);
INSERT INTO public.inventory VALUES (440, 40, 10, 220, 2);
INSERT INTO public.inventory VALUES (3, 33, 10, 2, 1);


--
-- Data for Name: laboratory; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.laboratory VALUES (1, 'Bayer', 'Alemania');
INSERT INTO public.laboratory VALUES (2, 'Pfizer', 'Estados Unidos');
INSERT INTO public.laboratory VALUES (3, 'Sanofi', 'Francia');
INSERT INTO public.laboratory VALUES (4, 'Genfar', 'Colombia');
INSERT INTO public.laboratory VALUES (5, 'GSK', 'Reino Unido');
INSERT INTO public.laboratory VALUES (6, 'Roche', 'Suiza');
INSERT INTO public.laboratory VALUES (7, 'Genéricos Perú', 'Perú');
INSERT INTO public.laboratory VALUES (8, 'Procter & Gamble', 'Estados Unidos');
INSERT INTO public.laboratory VALUES (9, 'Beiersdorf', 'Alemania');
INSERT INTO public.laboratory VALUES (10, 'Nature''s Bounty Co.', 'Estados Unidos');
INSERT INTO public.laboratory VALUES (11, 'Sunvit', 'Perú');
INSERT INTO public.laboratory VALUES (12, 'Solgar', 'Estados Unidos');
INSERT INTO public.laboratory VALUES (13, 'Centrum', 'Estados Unidos');


--
-- Data for Name: location; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.location VALUES (1, 'Botica Central Ate', 'Av. Metropolitana N.° 517, Lote 23, Urb. Ceres Etapa 2, Mz. G1, Ate, Lima', 'Ate', '998113090', 'bmboticascentral@gmail.com', 'Lun a Vie: 7:00 a.m. – 12:00 a.m. (medianoche)', 'Av. Metropolitana 517, Ceres, Ate, Lima, Perú', -12.0265000, -76.9192000, true);
INSERT INTO public.location VALUES (2, 'Botica Central Santa Anita', 'Av. Universitaria N.° 416, Urb. Universal 2da Etapa, Santa Anita, Lima', 'Santa Anita', '998113090', 'bmboticascentral@gmail.com', 'Lun a Vie: 7:00 a.m. – 12:00 a.m. (medianoche)', 'Av. Universitaria 416, Santa Anita, Lima, Perú', -12.0438000, -76.9722000, true);


--
-- Data for Name: order_detail; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: password_reset; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: payment; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: product; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.product VALUES (1, 'Levotiroxina 100mcg x 30 tabletas', 'Levotiroxina sódica 100mcg', NULL, NULL, NULL, NULL, '2027-03-31', NULL, false, 13.90, NULL, true, false, 3, 1);
INSERT INTO public.product VALUES (2, 'Sertralina 50mg x 30 tabletas', 'Sertralina 50mg', NULL, NULL, NULL, NULL, '2027-06-30', NULL, true, 24.90, NULL, true, false, 4, 1);
INSERT INTO public.product VALUES (3, 'Fluoxetina 20mg x 30 cápsulas', 'Fluoxetina 20mg', NULL, NULL, NULL, NULL, '2027-09-30', NULL, true, 19.90, NULL, true, false, 7, 1);
INSERT INTO public.product VALUES (4, 'Aciclovir 200mg x 25 tabletas', 'Aciclovir 200mg', NULL, NULL, NULL, NULL, '2027-12-31', NULL, true, 16.90, NULL, true, false, 4, 1);
INSERT INTO public.product VALUES (5, 'Prednisona 20mg x 20 tabletas', 'Prednisona 20mg', NULL, NULL, NULL, NULL, '2028-03-31', NULL, true, 10.90, NULL, true, false, 7, 1);
INSERT INTO public.product VALUES (6, 'Dexametasona 4mg x 10 tabletas', 'Dexametasona 4mg', NULL, NULL, NULL, NULL, '2028-06-30', NULL, true, 7.90, NULL, true, false, 7, 1);
INSERT INTO public.product VALUES (7, 'Carbamazepina 200mg x 20 tabletas', 'Carbamazepina 200mg', NULL, NULL, NULL, NULL, '2028-12-31', NULL, true, 14.50, NULL, true, false, 4, 1);
INSERT INTO public.product VALUES (8, 'Clonazepam 2mg x 30 tabletas', 'Clonazepam 2mg', NULL, NULL, NULL, NULL, '2029-06-30', NULL, false, 18.90, NULL, true, false, 6, 1);
INSERT INTO public.product VALUES (9, 'Gabapentina 300mg x 30 cápsulas', 'Gabapentina 300mg', NULL, NULL, NULL, NULL, '2029-12-31', NULL, false, 28.90, NULL, true, false, 2, 1);
INSERT INTO public.product VALUES (11, 'Metronidazol 500mg x 30 tabletas', 'Metronidazol 500mg', NULL, NULL, NULL, NULL, '2027-06-30', NULL, true, 12.50, NULL, true, false, 7, 1);
INSERT INTO public.product VALUES (12, 'Fluconazol 150mg x 1 cápsula', 'Fluconazol 150mg', NULL, NULL, NULL, NULL, '2027-09-30', NULL, false, 15.90, NULL, true, false, 2, 1);
INSERT INTO public.product VALUES (13, 'Furosemida 40mg x 20 tabletas', 'Furosemida 40mg', NULL, NULL, NULL, NULL, '2027-12-31', NULL, true, 8.50, NULL, true, false, 7, 1);
INSERT INTO public.product VALUES (14, 'Espironolactona 25mg x 20 tabletas', 'Espironolactona 25mg', NULL, NULL, NULL, NULL, '2028-03-31', NULL, true, 13.90, NULL, true, false, 4, 1);
INSERT INTO public.product VALUES (15, 'Hioscina 10mg x 10 tabletas', 'Butilbromuro de hioscina 10mg', NULL, NULL, NULL, NULL, '2028-06-30', NULL, true, 9.90, NULL, true, false, 7, 1);
INSERT INTO public.product VALUES (16, 'Ondansetrón 8mg x 10 tabletas', 'Ondansetrón 8mg', NULL, NULL, NULL, NULL, '2028-12-31', NULL, true, 16.90, NULL, true, false, 7, 1);
INSERT INTO public.product VALUES (17, 'Diazepam 10mg x 30 tabletas', 'Diazepam 10mg', NULL, NULL, NULL, NULL, '2029-06-30', NULL, false, 14.90, NULL, true, false, 6, 1);
INSERT INTO public.product VALUES (19, 'Suero Fisiológico 0.9% x 250ml', 'Cloruro de sodio 0.9%', NULL, NULL, NULL, NULL, '2027-03-31', NULL, true, 6.50, NULL, true, false, 7, 1);
INSERT INTO public.product VALUES (20, 'Loperamida 2mg x 12 tabletas', 'Loperamida 2mg', NULL, NULL, NULL, NULL, '2027-06-30', NULL, true, 7.50, NULL, true, false, 4, 1);
INSERT INTO public.product VALUES (22, 'Ibuprofeno 400mg x 50 cápsulas', 'Ibuprofeno 400mg', NULL, NULL, NULL, NULL, '2027-12-31', NULL, true, 12.90, NULL, true, false, 4, 2);
INSERT INTO public.product VALUES (23, 'Naproxeno 550mg x 20 tabletas', 'Naproxeno sódico 550mg', NULL, NULL, NULL, NULL, '2028-03-31', NULL, true, 14.50, NULL, true, false, 4, 2);
INSERT INTO public.product VALUES (24, 'Diclofenaco 50mg x 30 tabletas', 'Diclofenaco sódico 50mg', NULL, NULL, NULL, NULL, '2028-06-30', NULL, true, 9.90, NULL, true, false, 7, 2);
INSERT INTO public.product VALUES (26, 'Antalgina 500mg x 100 tabletas', 'Metamizol sódico 500mg', NULL, NULL, NULL, NULL, '2029-06-30', NULL, true, 10.50, NULL, true, false, 7, 2);
INSERT INTO public.product VALUES (27, 'Aspirina 500mg x 20 tabletas', 'Ácido acetilsalicílico 500mg', NULL, NULL, NULL, NULL, '2029-12-31', NULL, false, 11.90, NULL, true, false, 1, 2);
INSERT INTO public.product VALUES (28, 'Ketorolaco 10mg x 10 tabletas', 'Ketorolaco trometamina 10mg', NULL, NULL, NULL, NULL, '2027-03-31', NULL, true, 8.90, NULL, true, false, 4, 2);
INSERT INTO public.product VALUES (29, 'Dolocordralan Extra Forte x 50 tabletas', 'Diclofenaco + Complejo B', NULL, NULL, NULL, NULL, '2027-06-30', NULL, false, 19.90, NULL, true, false, 5, 2);
INSERT INTO public.product VALUES (30, 'Doloflam 100mg x 10 cápsulas', 'Aceclofenaco 100mg', NULL, NULL, NULL, NULL, '2027-09-30', NULL, false, 13.50, NULL, true, false, 4, 2);
INSERT INTO public.product VALUES (31, 'Paracetamol 1g x 16 tabletas', 'Paracetamol 1g', NULL, NULL, NULL, NULL, '2027-12-31', NULL, true, 9.50, NULL, true, false, 7, 2);
INSERT INTO public.product VALUES (32, 'Ibuprofeno 600mg x 30 tabletas', 'Ibuprofeno 600mg', NULL, NULL, NULL, NULL, '2028-03-31', NULL, true, 15.90, NULL, true, false, 4, 2);
INSERT INTO public.product VALUES (33, 'Celecoxib 200mg x 10 cápsulas', 'Celecoxib 200mg', NULL, NULL, NULL, NULL, '2028-06-30', NULL, false, 24.90, NULL, true, false, 2, 2);
INSERT INTO public.product VALUES (34, 'Etoricoxib 90mg x 7 tabletas', 'Etoricoxib 90mg', NULL, NULL, NULL, NULL, '2028-12-31', NULL, false, 21.50, NULL, true, false, 4, 2);
INSERT INTO public.product VALUES (35, 'Ketoprofeno 100mg x 20 tabletas', 'Ketoprofeno 100mg', NULL, NULL, NULL, NULL, '2029-06-30', NULL, false, 17.90, NULL, true, false, 3, 2);
INSERT INTO public.product VALUES (36, 'Tramadol 50mg x 10 cápsulas', 'Tramadol clorhidrato 50mg', NULL, NULL, NULL, NULL, '2029-12-31', NULL, true, 22.90, NULL, true, false, 4, 2);
INSERT INTO public.product VALUES (37, 'Buscapina 10mg x 20 grageas', 'Butilbromuro de hioscina 10mg', NULL, NULL, NULL, NULL, '2027-03-31', NULL, false, 18.50, NULL, true, false, 3, 2);
INSERT INTO public.product VALUES (38, 'Migragesic x 10 tabletas', 'Ergotamina + Cafeína', NULL, NULL, NULL, NULL, '2027-06-30', NULL, false, 14.90, NULL, true, false, 7, 2);
INSERT INTO public.product VALUES (39, 'Panadol 500mg x 24 tabletas', 'Paracetamol 500mg', NULL, NULL, NULL, NULL, '2027-09-30', NULL, false, 13.90, NULL, true, false, 5, 2);
INSERT INTO public.product VALUES (40, 'Flexiver Compuesto x 10 tabletas', 'Meloxicam + Complejo B', NULL, NULL, NULL, NULL, '2027-12-31', NULL, false, 18.90, NULL, true, false, 4, 2);
INSERT INTO public.product VALUES (41, 'Pañales Huggies Natural Care talla G x 60 unidades', NULL, NULL, NULL, NULL, NULL, '2028-03-31', NULL, false, 65.90, NULL, true, false, 8, 3);
INSERT INTO public.product VALUES (43, 'Pañales Babysec Ultra talla XG x 56 unidades', NULL, NULL, NULL, NULL, NULL, '2028-12-31', NULL, false, 49.90, NULL, true, false, 7, 3);
INSERT INTO public.product VALUES (44, 'Shampoo Johnson''s Baby 200ml', NULL, NULL, NULL, NULL, NULL, '2029-06-30', NULL, false, 14.50, NULL, true, false, 8, 3);
INSERT INTO public.product VALUES (45, 'Jabón Johnson''s Baby x 125g', NULL, NULL, NULL, NULL, NULL, '2029-12-31', NULL, false, 6.90, NULL, true, false, 8, 3);
INSERT INTO public.product VALUES (46, 'Colonia Johnson''s Baby 200ml', NULL, NULL, NULL, NULL, NULL, '2027-03-31', NULL, false, 19.90, NULL, true, false, 8, 3);
INSERT INTO public.product VALUES (48, 'Crema antipañalitis Hipoglós x 45g', 'Óxido de zinc', NULL, NULL, NULL, NULL, '2027-09-30', NULL, false, 22.90, NULL, true, false, 8, 3);
INSERT INTO public.product VALUES (49, 'Leche Enfamil Premium 1 x 400g', 'Fórmula infantil', NULL, NULL, NULL, NULL, '2027-12-31', NULL, false, 54.90, NULL, true, false, 7, 3);
INSERT INTO public.product VALUES (50, 'Leche NAN Optipro 1 x 400g', 'Fórmula infantil', NULL, NULL, NULL, NULL, '2028-03-31', NULL, false, 58.90, NULL, true, false, 7, 3);
INSERT INTO public.product VALUES (51, 'Biberón Avent Natural 260ml', NULL, NULL, NULL, NULL, NULL, '2028-06-30', NULL, false, 34.90, NULL, true, false, 8, 3);
INSERT INTO public.product VALUES (52, 'Chupón Avent ortodóntico x 2 unidades', NULL, NULL, NULL, NULL, NULL, '2028-12-31', NULL, false, 24.90, NULL, true, false, 8, 3);
INSERT INTO public.product VALUES (53, 'Mamadera anticólicos Dr. Brown''s 240ml', NULL, NULL, NULL, NULL, NULL, '2029-06-30', NULL, false, 39.90, NULL, true, false, 7, 3);
INSERT INTO public.product VALUES (54, 'Termómetro digital infantil', NULL, NULL, NULL, NULL, NULL, '2029-12-31', NULL, false, 18.90, NULL, true, false, 7, 3);
INSERT INTO public.product VALUES (55, 'Aspirador nasal para bebé', NULL, NULL, NULL, NULL, NULL, '2027-03-31', NULL, false, 12.90, NULL, true, false, 7, 3);
INSERT INTO public.product VALUES (56, 'Vitamina D3 gotas pediátricas 10ml', 'Colecalciferol', NULL, NULL, NULL, NULL, '2027-06-30', NULL, false, 26.90, NULL, true, false, 1, 3);
INSERT INTO public.product VALUES (57, 'Hierro pediátrico en gotas 30ml', 'Sulfato ferroso', NULL, NULL, NULL, NULL, '2027-09-30', NULL, false, 17.90, NULL, true, false, 7, 3);
INSERT INTO public.product VALUES (58, 'Paracetamol gotas pediátricas 15ml', 'Paracetamol 100mg/ml', NULL, NULL, NULL, NULL, '2027-12-31', NULL, true, 9.50, NULL, true, false, 7, 3);
INSERT INTO public.product VALUES (59, 'Pañalera multifuncional', NULL, NULL, NULL, NULL, NULL, '2028-03-31', NULL, false, 79.90, NULL, true, false, 7, 3);
INSERT INTO public.product VALUES (60, 'Protector solar bebé FPS50 100ml', NULL, NULL, NULL, NULL, NULL, '2028-06-30', NULL, false, 38.90, NULL, true, false, 1, 3);
INSERT INTO public.product VALUES (61, 'Vitamina C 1000mg x 60 tabletas', 'Ácido ascórbico 1000mg', NULL, NULL, NULL, NULL, '2028-12-31', NULL, false, 29.90, NULL, true, false, 1, 4);
INSERT INTO public.product VALUES (62, 'Complejo B x 30 tabletas', 'Tiamina, Riboflavina, Niacina, B6, B12', NULL, NULL, NULL, NULL, '2029-06-30', NULL, false, 24.50, NULL, true, false, 1, 4);
INSERT INTO public.product VALUES (63, 'Vitamina C 500mg x 30 tabletas efervescentes', 'Ácido ascórbico 500mg', NULL, NULL, NULL, NULL, '2029-12-31', NULL, true, 15.90, NULL, true, false, 7, 4);
INSERT INTO public.product VALUES (65, 'Supradyn Energy x 30 tabletas', 'Multivitamínico + minerales', NULL, NULL, NULL, NULL, '2027-06-30', NULL, false, 39.90, NULL, true, false, 1, 4);
INSERT INTO public.product VALUES (66, 'Centrum Adultos x 60 tabletas', 'Multivitamínico + minerales', NULL, NULL, NULL, NULL, '2027-09-30', NULL, false, 64.90, NULL, true, false, 2, 4);
INSERT INTO public.product VALUES (67, 'Centrum Silver 50+ x 60 tabletas', 'Multivitamínico adulto mayor', NULL, NULL, NULL, NULL, '2027-12-31', NULL, false, 69.90, NULL, true, false, 2, 4);
INSERT INTO public.product VALUES (68, 'Vitamina D3 2000 UI x 60 cápsulas', 'Colecalciferol 2000 UI', NULL, NULL, NULL, NULL, '2028-03-31', NULL, true, 28.90, NULL, true, false, 7, 4);
INSERT INTO public.product VALUES (69, 'Omega 3 1000mg x 60 cápsulas', 'Aceite de pescado (EPA/DHA)', NULL, NULL, NULL, NULL, '2028-06-30', NULL, false, 34.90, NULL, true, false, 7, 4);
INSERT INTO public.product VALUES (218, 'Sunvit B-12 1000mcg Tableta', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, 55.50, 71.90, true, true, 11, 4);
INSERT INTO public.product VALUES (70, 'Calcio + Vitamina D x 60 tabletas', 'Carbonato de calcio + D3', NULL, NULL, NULL, NULL, '2028-12-31', NULL, true, 22.90, NULL, true, false, 7, 4);
INSERT INTO public.product VALUES (71, 'Hierro + Ácido fólico x 30 tabletas', 'Sulfato ferroso + ácido fólico', NULL, NULL, NULL, NULL, '2029-06-30', NULL, true, 16.90, NULL, true, false, 7, 4);
INSERT INTO public.product VALUES (72, 'Magnesio + Zinc x 60 tabletas', 'Óxido de magnesio + zinc', NULL, NULL, NULL, NULL, '2029-12-31', NULL, false, 25.90, NULL, true, false, 7, 4);
INSERT INTO public.product VALUES (73, 'Vitamina E 400 UI x 30 cápsulas', 'Tocoferol 400 UI', NULL, NULL, NULL, NULL, '2027-03-31', NULL, false, 27.90, NULL, true, false, 1, 4);
INSERT INTO public.product VALUES (75, 'Colágeno hidrolizado + Vitamina C 300g', 'Colágeno hidrolizado', NULL, NULL, NULL, NULL, '2027-09-30', NULL, false, 49.90, NULL, true, false, 7, 4);
INSERT INTO public.product VALUES (76, 'Biotina 10000mcg x 60 cápsulas', 'Biotina 10000mcg', NULL, NULL, NULL, NULL, '2027-12-31', NULL, false, 31.90, NULL, true, false, 7, 4);
INSERT INTO public.product VALUES (77, 'Zinc 50mg x 60 tabletas', 'Sulfato de zinc 50mg', NULL, NULL, NULL, NULL, '2028-03-31', NULL, true, 19.90, NULL, true, false, 7, 4);
INSERT INTO public.product VALUES (78, 'Vitamina B12 1000mcg x 30 tabletas', 'Cianocobalamina 1000mcg', NULL, NULL, NULL, NULL, '2028-06-30', NULL, true, 18.90, NULL, true, false, 7, 4);
INSERT INTO public.product VALUES (79, 'Multivitamínico infantil masticable x 30', 'Multivitamínico infantil', NULL, NULL, NULL, NULL, '2028-12-31', NULL, false, 29.90, NULL, true, false, 1, 4);
INSERT INTO public.product VALUES (80, 'Ginkgo Biloba 120mg x 60 cápsulas', 'Ginkgo biloba 120mg', NULL, NULL, NULL, NULL, '2029-06-30', NULL, false, 33.90, NULL, true, false, 7, 4);
INSERT INTO public.product VALUES (82, 'Ibuprofeno Genérico 400mg x 100 cápsulas', 'Ibuprofeno 400mg', NULL, NULL, NULL, NULL, '2027-03-31', NULL, true, 7.90, NULL, true, false, 7, 5);
INSERT INTO public.product VALUES (83, 'Amoxicilina Genérica 500mg x 100 cápsulas', 'Amoxicilina 500mg', NULL, NULL, NULL, NULL, '2027-06-30', NULL, true, 12.90, NULL, true, false, 7, 5);
INSERT INTO public.product VALUES (84, 'Omeprazol Genérico 20mg x 30 cápsulas', 'Omeprazol 20mg', NULL, NULL, NULL, NULL, '2027-09-30', NULL, true, 8.90, NULL, true, false, 7, 5);
INSERT INTO public.product VALUES (85, 'Metformina Genérica 850mg x 30 tabletas', 'Metformina 850mg', NULL, NULL, NULL, NULL, '2027-12-31', NULL, true, 7.50, NULL, true, false, 7, 5);
INSERT INTO public.product VALUES (86, 'Losartán Genérico 50mg x 30 tabletas', 'Losartán 50mg', NULL, NULL, NULL, NULL, '2028-03-31', NULL, true, 9.90, NULL, true, false, 7, 5);
INSERT INTO public.product VALUES (87, 'Atorvastatina Genérica 20mg x 30 tabletas', 'Atorvastatina 20mg', NULL, NULL, NULL, NULL, '2028-06-30', NULL, true, 13.90, NULL, true, false, 7, 5);
INSERT INTO public.product VALUES (88, 'Enalapril Genérico 10mg x 30 tabletas', 'Enalapril 10mg', NULL, NULL, NULL, NULL, '2028-12-31', NULL, true, 6.90, NULL, true, false, 7, 5);
INSERT INTO public.product VALUES (90, 'Diclofenaco Genérico 50mg x 30 tabletas', 'Diclofenaco 50mg', NULL, NULL, NULL, NULL, '2029-12-31', NULL, true, 6.50, NULL, true, false, 7, 5);
INSERT INTO public.product VALUES (91, 'Loratadina Genérica 10mg x 30 tabletas', 'Loratadina 10mg', NULL, NULL, NULL, NULL, '2027-03-31', NULL, true, 7.90, NULL, true, false, 7, 5);
INSERT INTO public.product VALUES (92, 'Cetirizina Genérica 10mg x 30 tabletas', 'Cetirizina 10mg', NULL, NULL, NULL, NULL, '2027-06-30', NULL, true, 8.50, NULL, true, false, 7, 5);
INSERT INTO public.product VALUES (93, 'Azitromicina Genérica 500mg x 3 tabletas', 'Azitromicina 500mg', NULL, NULL, NULL, NULL, '2027-09-30', NULL, true, 11.90, NULL, true, false, 7, 5);
INSERT INTO public.product VALUES (94, 'Ciprofloxacino Genérico 500mg x 10 tabletas', 'Ciprofloxacino 500mg', NULL, NULL, NULL, NULL, '2027-12-31', NULL, true, 9.90, NULL, true, false, 7, 5);
INSERT INTO public.product VALUES (95, 'Metronidazol Genérico 500mg x 30 tabletas', 'Metronidazol 500mg', NULL, NULL, NULL, NULL, '2028-03-31', NULL, true, 10.50, NULL, true, false, 7, 5);
INSERT INTO public.product VALUES (96, 'Ranitidina Genérica 300mg x 20 tabletas', 'Ranitidina 300mg', NULL, NULL, NULL, NULL, '2028-06-30', NULL, true, 8.50, NULL, true, false, 7, 5);
INSERT INTO public.product VALUES (97, 'Aciclovir Genérico 200mg x 25 tabletas', 'Aciclovir 200mg', NULL, NULL, NULL, NULL, '2028-12-31', NULL, true, 12.90, NULL, true, false, 7, 5);
INSERT INTO public.product VALUES (98, 'Prednisona Genérica 20mg x 20 tabletas', 'Prednisona 20mg', NULL, NULL, NULL, NULL, '2029-06-30', NULL, true, 9.50, NULL, true, false, 7, 5);
INSERT INTO public.product VALUES (100, 'Dexametasona Genérica 4mg x 10 tabletas', 'Dexametasona 4mg', NULL, NULL, NULL, NULL, '2027-03-31', NULL, true, 6.90, NULL, true, false, 7, 5);
INSERT INTO public.product VALUES (102, 'Panadol Antigripal NF x 24 tabletas', 'Paracetamol + Fenilefrina', NULL, NULL, NULL, NULL, '2027-09-30', NULL, false, 24.90, NULL, true, false, 5, 6);
INSERT INTO public.product VALUES (103, 'Bisolvon Antigripal x 12 tabletas', 'Paracetamol + Fenilefrina', NULL, NULL, NULL, NULL, '2027-12-31', NULL, false, 17.90, NULL, true, false, 3, 6);
INSERT INTO public.product VALUES (104, 'Desenfriol-D x 12 tabletas', 'Paracetamol + Clorfenamina + Fenilefrina', NULL, NULL, NULL, NULL, '2028-03-31', NULL, false, 12.90, NULL, true, false, 7, 6);
INSERT INTO public.product VALUES (105, 'Tapsin Día y Noche x 12 tabletas', 'Paracetamol + descongestionante', NULL, NULL, NULL, NULL, '2028-06-30', NULL, false, 15.90, NULL, true, false, 7, 6);
INSERT INTO public.product VALUES (107, 'Refrianex Forte x 12 cápsulas', 'Paracetamol + Cafeína + Fenilefrina', NULL, NULL, NULL, NULL, '2029-06-30', NULL, false, 16.90, NULL, true, false, 4, 6);
INSERT INTO public.product VALUES (108, 'Multigrip x 12 tabletas', 'Paracetamol + Fenilefrina', NULL, NULL, NULL, NULL, '2029-12-31', NULL, false, 13.90, NULL, true, false, 4, 6);
INSERT INTO public.product VALUES (109, 'Nastizol Compositum x 12 tabletas', 'Clorfenamina + Fenilefrina', NULL, NULL, NULL, NULL, '2027-03-31', NULL, false, 11.90, NULL, true, false, 7, 6);
INSERT INTO public.product VALUES (110, 'Vick VapoRub 50g', 'Mentol + Alcanfor + Eucalipto', NULL, NULL, NULL, NULL, '2027-06-30', NULL, false, 16.90, NULL, true, false, 8, 6);
INSERT INTO public.product VALUES (112, 'Vitapyrena Forte x 10 sobres', 'Paracetamol + Vitamina C', NULL, NULL, NULL, NULL, '2027-12-31', NULL, false, 18.90, NULL, true, false, 4, 6);
INSERT INTO public.product VALUES (113, 'Frenadol Complex x 10 sobres', 'Paracetamol + Cafeína', NULL, NULL, NULL, NULL, '2028-03-31', NULL, false, 22.90, NULL, true, false, 5, 6);
INSERT INTO public.product VALUES (114, 'Bisolvon Tos jarabe 120ml', 'Bromhexina', NULL, NULL, NULL, NULL, '2028-06-30', NULL, false, 19.90, NULL, true, false, 3, 6);
INSERT INTO public.product VALUES (115, 'Notil jarabe antigripal 120ml', 'Paracetamol + antihistamínico', NULL, NULL, NULL, NULL, '2028-12-31', NULL, false, 14.90, NULL, true, false, 7, 6);
INSERT INTO public.product VALUES (116, 'Strepsils pastillas para la garganta x 24', 'Amilmetacresol', NULL, NULL, NULL, NULL, '2029-06-30', NULL, false, 12.90, NULL, true, false, 5, 6);
INSERT INTO public.product VALUES (118, 'Afrin descongestionante nasal 15ml', 'Oximetazolina', NULL, NULL, NULL, NULL, '2027-03-31', NULL, false, 17.90, NULL, true, false, 1, 6);
INSERT INTO public.product VALUES (119, 'Antigripal Día y Noche x 16 cápsulas', 'Paracetamol + pseudoefedrina', NULL, NULL, NULL, NULL, '2027-06-30', NULL, false, 19.90, NULL, true, false, 7, 6);
INSERT INTO public.product VALUES (120, 'Paracetamol + Cafeína 500mg x 16 tabletas', 'Paracetamol + Cafeína', NULL, NULL, NULL, NULL, '2027-09-30', NULL, true, 11.90, NULL, true, false, 7, 6);
INSERT INTO public.product VALUES (122, 'Azitromicina 500mg x 3 tabletas', 'Azitromicina 500mg', NULL, NULL, NULL, NULL, '2028-03-31', NULL, false, 19.90, NULL, true, false, 2, 7);
INSERT INTO public.product VALUES (123, 'Ciprofloxacino 500mg x 10 tabletas', 'Ciprofloxacino 500mg', NULL, NULL, NULL, NULL, '2028-06-30', NULL, true, 16.90, NULL, true, false, 4, 7);
INSERT INTO public.product VALUES (124, 'Cefalexina 500mg x 20 cápsulas', 'Cefalexina 500mg', NULL, NULL, NULL, NULL, '2028-12-31', NULL, true, 18.90, NULL, true, false, 7, 7);
INSERT INTO public.product VALUES (125, 'Amoxicilina + Ácido Clavulánico 1g x 14 tabletas', 'Amoxicilina + clavulánico', NULL, NULL, NULL, NULL, '2029-06-30', NULL, false, 34.90, NULL, true, false, 5, 7);
INSERT INTO public.product VALUES (126, 'Claritromicina 500mg x 10 tabletas', 'Claritromicina 500mg', NULL, NULL, NULL, NULL, '2029-12-31', NULL, false, 28.90, NULL, true, false, 4, 7);
INSERT INTO public.product VALUES (127, 'Doxiciclina 100mg x 10 cápsulas', 'Doxiciclina 100mg', NULL, NULL, NULL, NULL, '2027-03-31', NULL, true, 13.90, NULL, true, false, 7, 7);
INSERT INTO public.product VALUES (128, 'Clindamicina 300mg x 16 cápsulas', 'Clindamicina 300mg', NULL, NULL, NULL, NULL, '2027-06-30', NULL, false, 24.90, NULL, true, false, 4, 7);
INSERT INTO public.product VALUES (129, 'Eritromicina 500mg x 20 tabletas', 'Eritromicina 500mg', NULL, NULL, NULL, NULL, '2027-09-30', NULL, true, 17.90, NULL, true, false, 7, 7);
INSERT INTO public.product VALUES (131, 'Loratadina 10mg x 10 tabletas', 'Loratadina 10mg', NULL, NULL, NULL, NULL, '2028-03-31', NULL, true, 9.80, NULL, true, false, 7, 8);
INSERT INTO public.product VALUES (132, 'Cetirizina 10mg x 10 tabletas', 'Cetirizina 10mg', NULL, NULL, NULL, NULL, '2028-06-30', NULL, true, 11.90, NULL, true, false, 4, 8);
INSERT INTO public.product VALUES (134, 'Desloratadina 5mg x 10 tabletas', 'Desloratadina 5mg', NULL, NULL, NULL, NULL, '2029-06-30', NULL, false, 16.90, NULL, true, false, 4, 8);
INSERT INTO public.product VALUES (135, 'Loratadina jarabe 60ml', 'Loratadina 5mg/5ml', NULL, NULL, NULL, NULL, '2029-12-31', NULL, true, 12.90, NULL, true, false, 7, 8);
INSERT INTO public.product VALUES (136, 'Aerius 5mg x 10 tabletas', 'Desloratadina 5mg', NULL, NULL, NULL, NULL, '2027-03-31', NULL, false, 22.90, NULL, true, false, 7, 8);
INSERT INTO public.product VALUES (137, 'Fexofenadina 180mg x 10 tabletas', 'Fexofenadina 180mg', NULL, NULL, NULL, NULL, '2027-06-30', NULL, false, 19.90, NULL, true, false, 4, 8);
INSERT INTO public.product VALUES (138, 'Ebastina 10mg x 10 tabletas', 'Ebastina 10mg', NULL, NULL, NULL, NULL, '2027-09-30', NULL, true, 14.90, NULL, true, false, 7, 8);
INSERT INTO public.product VALUES (139, 'Levocetirizina 5mg x 10 tabletas', 'Levocetirizina 5mg', NULL, NULL, NULL, NULL, '2027-12-31', NULL, true, 15.90, NULL, true, false, 4, 8);
INSERT INTO public.product VALUES (141, 'Alcohol Medicinal 96° x 250ml', 'Etanol 96°', NULL, NULL, NULL, NULL, '2028-06-30', NULL, false, 7.50, NULL, true, false, 7, 9);
INSERT INTO public.product VALUES (143, 'Crema dental Colgate Total 12 x 75g', 'Triclosán', NULL, NULL, NULL, NULL, '2029-06-30', NULL, false, 6.90, NULL, true, false, 8, 9);
INSERT INTO public.product VALUES (144, 'Gel antibacterial 500ml', 'Alcohol en gel 70%', NULL, NULL, NULL, NULL, '2029-12-31', NULL, false, 12.90, NULL, true, false, 7, 9);
INSERT INTO public.product VALUES (145, 'Jabón antibacterial líquido 250ml', NULL, NULL, NULL, NULL, NULL, '2027-03-31', NULL, false, 9.90, NULL, true, false, 8, 9);
INSERT INTO public.product VALUES (146, 'Algodón hidrófilo 100g', NULL, NULL, NULL, NULL, NULL, '2027-06-30', NULL, false, 5.90, NULL, true, false, 7, 9);
INSERT INTO public.product VALUES (148, 'Enjuague bucal Listerine 250ml', NULL, NULL, NULL, NULL, NULL, '2027-12-31', NULL, false, 15.90, NULL, true, false, 8, 9);
INSERT INTO public.product VALUES (149, 'Hisopos de algodón x 100 unidades', NULL, NULL, NULL, NULL, NULL, '2028-03-31', NULL, false, 4.90, NULL, true, false, 7, 9);
INSERT INTO public.product VALUES (150, 'Toallas higiénicas Always x 16 unidades', NULL, NULL, NULL, NULL, NULL, '2028-06-30', NULL, false, 8.90, NULL, true, false, 8, 9);
INSERT INTO public.product VALUES (151, 'Protector solar facial FPS50 50ml', NULL, NULL, NULL, NULL, NULL, '2028-12-31', NULL, false, 42.90, NULL, true, false, 1, 10);
INSERT INTO public.product VALUES (153, 'Clotrimazol crema 1% x 20g', 'Clotrimazol 1%', NULL, NULL, NULL, NULL, '2029-12-31', NULL, true, 9.90, NULL, true, false, 4, 10);
INSERT INTO public.product VALUES (154, 'Ketoconazol shampoo 2% 120ml', 'Ketoconazol 2%', NULL, NULL, NULL, NULL, '2027-03-31', NULL, false, 24.90, NULL, true, false, 7, 10);
INSERT INTO public.product VALUES (155, 'Crema cicatrizante Cicalfate 40ml', NULL, NULL, NULL, NULL, NULL, '2027-06-30', NULL, false, 44.90, NULL, true, false, 7, 10);
INSERT INTO public.product VALUES (156, 'Ácido salicílico gel antiacné 30g', 'Ácido salicílico', NULL, NULL, NULL, NULL, '2027-09-30', NULL, false, 16.90, NULL, true, false, 7, 10);
INSERT INTO public.product VALUES (157, 'Calamina loción 120ml', 'Calamina', NULL, NULL, NULL, NULL, '2027-12-31', NULL, true, 11.90, NULL, true, false, 7, 10);
INSERT INTO public.product VALUES (158, 'Mupirocina ungüento 2% x 15g', 'Mupirocina 2%', NULL, NULL, NULL, NULL, '2028-03-31', NULL, false, 19.90, NULL, true, false, 5, 10);
INSERT INTO public.product VALUES (160, 'Gel de aloe vera 200ml', 'Aloe vera', NULL, NULL, NULL, NULL, '2028-12-31', NULL, false, 14.90, NULL, true, false, 7, 10);
INSERT INTO public.product VALUES (161, 'Lejía concentrada 1L', 'Hipoclorito de sodio', NULL, NULL, NULL, NULL, '2029-06-30', NULL, false, 4.90, NULL, true, false, 7, 11);
INSERT INTO public.product VALUES (162, 'Alcohol isopropílico 1L', 'Isopropanol', NULL, NULL, NULL, NULL, '2029-12-31', NULL, false, 14.90, NULL, true, false, 7, 11);
INSERT INTO public.product VALUES (164, 'Guantes de látex descartables x 100 unidades', NULL, NULL, NULL, NULL, NULL, '2027-06-30', NULL, false, 19.90, NULL, true, false, 7, 11);
INSERT INTO public.product VALUES (165, 'Mascarillas quirúrgicas x 50 unidades', NULL, NULL, NULL, NULL, NULL, '2027-09-30', NULL, false, 12.90, NULL, true, false, 7, 11);
INSERT INTO public.product VALUES (166, 'Jabón en barra antibacterial x 3 unidades', NULL, NULL, NULL, NULL, NULL, '2027-12-31', NULL, false, 8.90, NULL, true, false, 8, 11);
INSERT INTO public.product VALUES (167, 'Spray desinfectante de superficies 400ml', NULL, NULL, NULL, NULL, NULL, '2028-03-31', NULL, false, 13.90, NULL, true, false, 7, 11);
INSERT INTO public.product VALUES (168, 'Bolsas para desechos biológicos x 20 unidades', NULL, NULL, NULL, NULL, NULL, '2028-06-30', NULL, false, 9.90, NULL, true, false, 7, 11);
INSERT INTO public.product VALUES (170, 'Papel toalla institucional x 6 unidades', NULL, NULL, NULL, NULL, NULL, '2029-06-30', NULL, false, 15.90, NULL, true, false, 7, 11);
INSERT INTO public.product VALUES (172, 'Ranitidina 300mg x 20 tabletas', 'Ranitidina 300mg', NULL, NULL, NULL, NULL, '2027-03-31', NULL, true, 9.90, NULL, true, false, 7, 12);
INSERT INTO public.product VALUES (173, 'Sal de Andrews x 12 sobres', 'Bicarbonato de sodio', NULL, NULL, NULL, NULL, '2027-06-30', NULL, false, 7.90, NULL, true, false, 5, 12);
INSERT INTO public.product VALUES (174, 'Hidróxido de aluminio suspensión 360ml', 'Hidróxido de aluminio', NULL, NULL, NULL, NULL, '2027-09-30', NULL, true, 11.90, NULL, true, false, 7, 12);
INSERT INTO public.product VALUES (175, 'Loperamida 2mg x 12 tabletas', 'Loperamida 2mg', NULL, NULL, NULL, NULL, '2027-12-31', NULL, true, 7.50, NULL, true, false, 4, 12);
INSERT INTO public.product VALUES (176, 'Pantoprazol 40mg x 30 tabletas', 'Pantoprazol 40mg', NULL, NULL, NULL, NULL, '2028-03-31', NULL, true, 18.90, NULL, true, false, 4, 12);
INSERT INTO public.product VALUES (177, 'Esomeprazol 40mg x 14 tabletas', 'Esomeprazol 40mg', NULL, NULL, NULL, NULL, '2028-06-30', NULL, true, 24.90, NULL, true, false, 7, 12);
INSERT INTO public.product VALUES (178, 'Dimenhidrinato 50mg x 10 tabletas', 'Dimenhidrinato 50mg', NULL, NULL, NULL, NULL, '2028-12-31', NULL, true, 8.90, NULL, true, false, 7, 12);
INSERT INTO public.product VALUES (179, 'Probióticos Floratil x 6 cápsulas', 'Saccharomyces boulardii', NULL, NULL, NULL, NULL, '2029-06-30', NULL, false, 28.90, NULL, true, false, 7, 12);
INSERT INTO public.product VALUES (182, 'Enalapril 10mg x 30 tabletas', 'Enalapril maleato 10mg', NULL, NULL, NULL, NULL, '2027-06-30', NULL, true, 7.90, NULL, true, false, 7, 13);
INSERT INTO public.product VALUES (183, 'Amlodipino 5mg x 30 tabletas', 'Amlodipino 5mg', NULL, NULL, NULL, NULL, '2027-09-30', NULL, true, 9.90, NULL, true, false, 4, 13);
INSERT INTO public.product VALUES (184, 'Atorvastatina 20mg x 30 tabletas', 'Atorvastatina 20mg', NULL, NULL, NULL, NULL, '2027-12-31', NULL, false, 26.90, NULL, true, false, 2, 13);
INSERT INTO public.product VALUES (185, 'Aspirina 100mg Cardio x 28 tabletas', 'Ácido acetilsalicílico 100mg', NULL, NULL, NULL, NULL, '2028-03-31', NULL, false, 13.90, NULL, true, false, 1, 13);
INSERT INTO public.product VALUES (186, 'Atenolol 50mg x 30 tabletas', 'Atenolol 50mg', NULL, NULL, NULL, NULL, '2028-06-30', NULL, true, 8.90, NULL, true, false, 7, 13);
INSERT INTO public.product VALUES (187, 'Valsartán 80mg x 28 tabletas', 'Valsartán 80mg', NULL, NULL, NULL, NULL, '2028-12-31', NULL, true, 19.90, NULL, true, false, 4, 13);
INSERT INTO public.product VALUES (188, 'Carvedilol 25mg x 30 tabletas', 'Carvedilol 25mg', NULL, NULL, NULL, NULL, '2029-06-30', NULL, true, 16.90, NULL, true, false, 7, 13);
INSERT INTO public.product VALUES (190, 'Rosuvastatina 10mg x 30 tabletas', 'Rosuvastatina 10mg', NULL, NULL, NULL, NULL, '2027-03-31', NULL, true, 28.90, NULL, true, false, 4, 13);
INSERT INTO public.product VALUES (192, 'Metformina 1000mg x 30 tabletas', 'Metformina clorhidrato 1000mg', NULL, NULL, NULL, NULL, '2027-09-30', NULL, true, 13.90, NULL, true, false, 7, 14);
INSERT INTO public.product VALUES (193, 'Glibenclamida 5mg x 30 tabletas', 'Glibenclamida 5mg', NULL, NULL, NULL, NULL, '2027-12-31', NULL, true, 7.90, NULL, true, false, 7, 14);
INSERT INTO public.product VALUES (194, 'Glimepirida 2mg x 30 tabletas', 'Glimepirida 2mg', NULL, NULL, NULL, NULL, '2028-03-31', NULL, false, 18.90, NULL, true, false, 3, 14);
INSERT INTO public.product VALUES (195, 'Tiras reactivas de glucosa x 50 unidades', NULL, NULL, NULL, NULL, NULL, '2028-06-30', NULL, false, 64.90, NULL, true, false, 6, 14);
INSERT INTO public.product VALUES (197, 'Lancetas para glucómetro x 100 unidades', NULL, NULL, NULL, NULL, NULL, '2029-06-30', NULL, false, 24.90, NULL, true, false, 6, 14);
INSERT INTO public.product VALUES (198, 'Insulina NPH 100UI/ml 10ml', 'Insulina humana NPH', NULL, NULL, NULL, NULL, '2029-12-31', NULL, false, 38.90, NULL, true, false, 3, 14);
INSERT INTO public.product VALUES (199, 'Sitagliptina 50mg x 28 tabletas', 'Sitagliptina 50mg', NULL, NULL, NULL, NULL, '2027-03-31', NULL, false, 44.90, NULL, true, false, 4, 14);
INSERT INTO public.product VALUES (200, 'Jeringas para insulina x 10 unidades', NULL, NULL, NULL, NULL, NULL, '2027-06-30', NULL, false, 9.90, NULL, true, false, 7, 14);
INSERT INTO public.product VALUES (202, 'Ambroxol jarabe 120ml', 'Ambroxol clorhidrato', NULL, NULL, NULL, NULL, '2027-12-31', NULL, true, 12.90, NULL, true, false, 7, 15);
INSERT INTO public.product VALUES (203, 'Bromhexina jarabe 120ml', 'Bromhexina', NULL, NULL, NULL, NULL, '2028-03-31', NULL, true, 11.90, NULL, true, false, 7, 15);
INSERT INTO public.product VALUES (204, 'Salbutamol + Ipratropio inhalador', 'Salbutamol + ipratropio', NULL, NULL, NULL, NULL, '2028-06-30', NULL, false, 32.90, NULL, true, false, 5, 15);
INSERT INTO public.product VALUES (205, 'Budesonida inhalador 200mcg', 'Budesonida 200mcg', NULL, NULL, NULL, NULL, '2028-12-31', NULL, false, 38.90, NULL, true, false, 4, 15);
INSERT INTO public.product VALUES (206, 'Loratadina + Pseudoefedrina x 10 tabletas', 'Loratadina + pseudoefedrina', NULL, NULL, NULL, NULL, '2029-06-30', NULL, false, 15.90, NULL, true, false, 7, 15);
INSERT INTO public.product VALUES (207, 'Suero fisiológico para nebulizar x 25 ampollas', 'Cloruro de sodio 0.9%', NULL, NULL, NULL, NULL, '2029-12-31', NULL, true, 16.90, NULL, true, false, 7, 15);
INSERT INTO public.product VALUES (208, 'Acetilcisteína 600mg x 10 sobres', 'Acetilcisteína 600mg', NULL, NULL, NULL, NULL, '2027-03-31', NULL, true, 19.90, NULL, true, false, 7, 15);
INSERT INTO public.product VALUES (209, 'Beclometasona spray nasal', 'Beclometasona', NULL, NULL, NULL, NULL, '2027-06-30', NULL, false, 27.90, NULL, true, false, 5, 15);
INSERT INTO public.product VALUES (10, 'Albendazol 400mg x 2 tabletas', 'Albendazol 400mg', NULL, NULL, NULL, NULL, '2027-03-31', NULL, true, 6.90, 11.30, true, true, 4, 1);
INSERT INTO public.product VALUES (18, 'Sales de Rehidratación Oral x 5 sobres', 'Electrolitos orales', NULL, NULL, NULL, NULL, '2029-12-31', NULL, true, 8.90, 10.20, true, true, 7, 1);
INSERT INTO public.product VALUES (21, 'Paracetamol 500mg x 100 tabletas', 'Paracetamol 500mg', NULL, NULL, NULL, NULL, '2027-09-30', NULL, true, 8.50, 12.90, true, true, 7, 2);
INSERT INTO public.product VALUES (25, 'Apronax 550mg x 10 tabletas', 'Naproxeno sódico 550mg', NULL, NULL, NULL, NULL, '2028-12-31', NULL, false, 16.90, 21.40, true, true, 1, 2);
INSERT INTO public.product VALUES (42, 'Pañales Pampers Premium Care talla M x 64 unidades', NULL, NULL, NULL, NULL, NULL, '2028-06-30', NULL, false, 69.90, 84.20, true, true, 8, 3);
INSERT INTO public.product VALUES (47, 'Toallitas húmedas Huggies x 48 unidades', NULL, NULL, NULL, NULL, NULL, '2027-06-30', NULL, false, 9.90, 11.10, true, true, 8, 3);
INSERT INTO public.product VALUES (64, 'Redoxon Triple Acción x 30 tabletas', 'Vitamina C + Zinc + Vitamina D', NULL, NULL, NULL, NULL, '2027-03-31', NULL, false, 32.90, 63.30, true, true, 1, 4);
INSERT INTO public.product VALUES (74, 'Ácido fólico 5mg x 30 tabletas', 'Ácido fólico 5mg', NULL, NULL, NULL, NULL, '2027-06-30', NULL, true, 7.90, 12.30, true, true, 7, 4);
INSERT INTO public.product VALUES (81, 'Paracetamol Genérico 500mg x 100 tabletas', 'Paracetamol 500mg', NULL, NULL, NULL, NULL, '2029-12-31', NULL, true, 5.90, 10.50, true, true, 7, 5);
INSERT INTO public.product VALUES (89, 'Naproxeno Genérico 550mg x 30 tabletas', 'Naproxeno 550mg', NULL, NULL, NULL, NULL, '2029-06-30', NULL, true, 9.50, 11.60, true, true, 7, 5);
INSERT INTO public.product VALUES (99, 'Salbutamol Genérico inhalador 100mcg', 'Salbutamol 100mcg', NULL, NULL, NULL, NULL, '2029-12-31', NULL, true, 13.90, 26.20, true, true, 7, 5);
INSERT INTO public.product VALUES (101, 'Panadol Antigripal x 12 tabletas', 'Paracetamol + Fenilefrina + Clorfenamina', NULL, NULL, NULL, NULL, '2027-06-30', NULL, false, 18.90, 23.60, true, true, 5, 6);
INSERT INTO public.product VALUES (106, 'Antigripal Genérico x 100 tabletas', 'Paracetamol + Clorfenamina', NULL, NULL, NULL, NULL, '2028-12-31', NULL, true, 14.90, 17.30, true, true, 7, 6);
INSERT INTO public.product VALUES (111, 'Vick VapoRub 100g', 'Mentol + Alcanfor + Eucalipto', NULL, NULL, NULL, NULL, '2027-09-30', NULL, false, 24.90, 48.80, true, true, 8, 6);
INSERT INTO public.product VALUES (117, 'Mentho-Lyptus caramelos x 20', 'Mentol + eucalipto', NULL, NULL, NULL, NULL, '2029-12-31', NULL, false, 4.90, 9.80, true, true, 7, 6);
INSERT INTO public.product VALUES (121, 'Amoxicilina 500mg x 21 cápsulas', 'Amoxicilina trihidrato 500mg', NULL, NULL, NULL, NULL, '2027-12-31', NULL, true, 15.50, 24.60, true, true, 4, 7);
INSERT INTO public.product VALUES (130, 'Levofloxacino 500mg x 7 tabletas', 'Levofloxacino 500mg', NULL, NULL, NULL, NULL, '2027-12-31', NULL, false, 26.90, 32.80, true, true, 4, 7);
INSERT INTO public.product VALUES (133, 'Clorfenamina 4mg x 20 tabletas', 'Clorfenamina maleato 4mg', NULL, NULL, NULL, NULL, '2028-12-31', NULL, true, 5.90, 9.70, true, true, 7, 8);
INSERT INTO public.product VALUES (140, 'Betametasona crema 0.05% x 30g', 'Betametasona 0.05%', NULL, NULL, NULL, NULL, '2028-03-31', NULL, true, 13.90, 26.20, true, true, 7, 8);
INSERT INTO public.product VALUES (142, 'Curitas adhesivas surtidas x 100 unidades', NULL, NULL, NULL, NULL, NULL, '2028-12-31', NULL, false, 11.90, 14.90, true, true, 7, 9);
INSERT INTO public.product VALUES (147, 'Alcohol en gel 250ml', 'Alcohol 70%', NULL, NULL, NULL, NULL, '2027-09-30', NULL, false, 7.90, 9.20, true, true, 7, 9);
INSERT INTO public.product VALUES (152, 'Crema hidratante Cetaphil 100ml', NULL, NULL, NULL, NULL, NULL, '2029-06-30', NULL, false, 38.90, 76.30, true, true, 7, 10);
INSERT INTO public.product VALUES (159, 'Crema humectante con urea 10% 100g', 'Urea 10%', NULL, NULL, NULL, NULL, '2028-06-30', NULL, false, 22.90, 27.30, true, true, 7, 10);
INSERT INTO public.product VALUES (163, 'Desinfectante multiusos Lysol 900ml', NULL, NULL, NULL, NULL, NULL, '2027-03-31', NULL, false, 16.90, 30.20, true, true, 7, 11);
INSERT INTO public.product VALUES (169, 'Repelente de insectos 120ml', 'DEET', NULL, NULL, NULL, NULL, '2028-12-31', NULL, false, 17.90, 32.50, true, true, 7, 11);
INSERT INTO public.product VALUES (171, 'Omeprazol 20mg x 30 cápsulas', 'Omeprazol 20mg', NULL, NULL, NULL, NULL, '2029-12-31', NULL, true, 12.90, 15.70, true, true, 7, 12);
INSERT INTO public.product VALUES (180, 'Sales de rehidratación oral x 5 sobres', 'Electrolitos orales', NULL, NULL, NULL, NULL, '2029-12-31', NULL, true, 8.90, 14.80, true, true, 7, 12);
INSERT INTO public.product VALUES (181, 'Losartán 50mg x 30 tabletas', 'Losartán potásico 50mg', NULL, NULL, NULL, NULL, '2027-03-31', NULL, true, 11.90, 22.50, true, true, 4, 13);
INSERT INTO public.product VALUES (189, 'Clopidogrel 75mg x 28 tabletas', 'Clopidogrel 75mg', NULL, NULL, NULL, NULL, '2029-12-31', NULL, false, 32.90, 41.60, true, true, 3, 13);
INSERT INTO public.product VALUES (191, 'Metformina 850mg x 30 tabletas', 'Metformina clorhidrato 850mg', NULL, NULL, NULL, NULL, '2027-06-30', NULL, true, 11.90, 18.30, true, true, 4, 14);
INSERT INTO public.product VALUES (196, 'Glucómetro Accu-Chek Active', NULL, NULL, NULL, NULL, NULL, '2028-12-31', NULL, false, 89.90, 126.60, true, true, 6, 14);
INSERT INTO public.product VALUES (201, 'Salbutamol inhalador 100mcg x 200 dosis', 'Salbutamol 100mcg', NULL, NULL, NULL, NULL, '2027-09-30', NULL, false, 18.90, 24.50, true, true, 5, 15);
INSERT INTO public.product VALUES (210, 'Dextrometorfano jarabe 120ml', 'Dextrometorfano', NULL, NULL, NULL, NULL, '2027-09-30', NULL, true, 13.90, 25.30, true, true, 7, 15);
INSERT INTO public.product VALUES (211, 'Protector Solar Facial Eucerin Tono Claro FPS 50+', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, 96.00, 120.00, true, true, 9, 10);
INSERT INTO public.product VALUES (212, 'Fluido Facial Hidratante Matificante Eucerin DermoPure para Piel Grasa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, 100.00, 125.00, true, true, 9, 10);
INSERT INTO public.product VALUES (213, 'Gel Limpiador Concentrado Eucerin Dermopure para Piel Grasa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, 72.00, 90.00, true, true, 9, 10);
INSERT INTO public.product VALUES (214, 'Sérum Anti-manchas Eucerin DermoPure Triple Effect para Piel Grasa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, 128.00, 160.00, true, true, 9, 10);
INSERT INTO public.product VALUES (215, 'Gel limpiador facial Eucerin Dermopure Triple Effect 400 ml', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, 101.20, 126.50, true, true, 9, 10);
INSERT INTO public.product VALUES (216, 'Exfoliante Eucerin DermoPURE Oil Control para piel grasa 100 ml', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, 68.40, 85.50, true, true, 9, 10);
INSERT INTO public.product VALUES (217, 'Nature''s Bounty Biotina 5000 mcg 72 cápsulas blandas de liberación rápida', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, 52.70, 65.90, true, true, 10, 4);
INSERT INTO public.product VALUES (219, 'Solgar Concentrado de aceite de pescado con omega-3 con 120 cápsulas blandas', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, 62.90, 78.60, true, true, 12, 4);
INSERT INTO public.product VALUES (220, 'Centrum Suplemento multivitamínico para mujeres con 200 comprimidos', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, 175.00, 250.00, true, true, 13, 4);


--
-- Data for Name: trusted_device; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES (3, 'TRAB02', '$2a$10$SRT96rawTRdw5Dj3cbvU2OquKLMk/qILIDsYIrYPcP6ilBDRvf1nu', 'Ana Torres', 'emp', 2, true, '2026-06-29 17:59:32.515556', NULL, 0, NULL, 'ysantossiguenza@gmail.com', NULL, NULL, 0, NULL);
INSERT INTO public.users VALUES (1, 'ADMIN01', '$2a$10$w1hWxbO.DGClvPDjx.qBN.tkxIhMuyv8ngEe6rtXh8azQrwyz01eW', 'Jorge Pérez', 'admin', NULL, true, '2026-06-29 18:01:00.203807', NULL, 0, NULL, 'jeanarteaga.2020@gmail.com', NULL, NULL, 0, NULL);
INSERT INTO public.users VALUES (2, 'TRAB01', '$2a$10$qiWp0AQEOi6uC9VlD7nmb.6amzLTThUkzxWV37/xwltqZ/ftV/pf.', 'Carlos Quispe', 'emp', 1, true, '2026-06-29 18:38:10.862406', NULL, 0, NULL, 'jeanfotosacc@gmail.com', NULL, NULL, 0, NULL);


--
-- Name: category_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.category_category_id_seq', 15, true);


--
-- Name: customer_customer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customer_customer_id_seq', 6, true);


--
-- Name: image_image_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.image_image_id_seq', 220, true);


--
-- Name: inventory_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_inventory_id_seq', 440, true);


--
-- Name: laboratory_laboratory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.laboratory_laboratory_id_seq', 13, true);


--
-- Name: location_location_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.location_location_id_seq', 2, true);


--
-- Name: order_detail_detail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_detail_detail_id_seq', 5, true);


--
-- Name: orders_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orders_order_id_seq', 5, true);


--
-- Name: password_reset_reset_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.password_reset_reset_id_seq', 2, true);


--
-- Name: payment_payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payment_payment_id_seq', 5, true);


--
-- Name: product_product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_product_id_seq', 220, true);


--
-- Name: trusted_device_device_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.trusted_device_device_id_seq', 2, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_user_id_seq', 3, true);


--
-- Name: category category_category_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_category_name_key UNIQUE (category_name);


--
-- Name: category category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_pkey PRIMARY KEY (category_id);


--
-- Name: customer customer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_pkey PRIMARY KEY (customer_id);


--
-- Name: image image_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image
    ADD CONSTRAINT image_pkey PRIMARY KEY (image_id);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (inventory_id);


--
-- Name: inventory inventory_product_id_location_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_product_id_location_id_key UNIQUE (product_id, location_id);


--
-- Name: laboratory laboratory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laboratory
    ADD CONSTRAINT laboratory_pkey PRIMARY KEY (laboratory_id);


--
-- Name: location location_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location
    ADD CONSTRAINT location_pkey PRIMARY KEY (location_id);


--
-- Name: order_detail order_detail_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_detail
    ADD CONSTRAINT order_detail_pkey PRIMARY KEY (detail_id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);


--
-- Name: password_reset password_reset_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset
    ADD CONSTRAINT password_reset_pkey PRIMARY KEY (reset_id);


--
-- Name: payment payment_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_order_id_key UNIQUE (order_id);


--
-- Name: payment payment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_pkey PRIMARY KEY (payment_id);


--
-- Name: product product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (product_id);


--
-- Name: trusted_device trusted_device_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_device
    ADD CONSTRAINT trusted_device_pkey PRIMARY KEY (device_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_user_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_code_key UNIQUE (user_code);


--
-- Name: idx_category_featured_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_category_featured_order ON public.category USING btree (is_featured, display_order) WHERE (is_featured = true);


--
-- Name: idx_customer_dni; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customer_dni ON public.customer USING btree (dni) WHERE (dni IS NOT NULL);


--
-- Name: idx_customer_email_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_customer_email_unique ON public.customer USING btree (lower((email)::text)) WHERE (email IS NOT NULL);


--
-- Name: idx_image_main_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_image_main_unique ON public.image USING btree (product_id) WHERE ((type)::text = 'main'::text);


--
-- Name: idx_image_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_image_product ON public.image USING btree (product_id);


--
-- Name: idx_inventory_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_location ON public.inventory USING btree (location_id);


--
-- Name: idx_inventory_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_product ON public.inventory USING btree (product_id);


--
-- Name: idx_order_detail_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_detail_order ON public.order_detail USING btree (order_id);


--
-- Name: idx_order_detail_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_detail_product ON public.order_detail USING btree (product_id);


--
-- Name: idx_orders_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_customer ON public.orders USING btree (customer_id);


--
-- Name: idx_orders_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_date ON public.orders USING btree (order_date DESC);


--
-- Name: idx_orders_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_location ON public.orders USING btree (location_id);


--
-- Name: idx_orders_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_state ON public.orders USING btree (order_state);


--
-- Name: idx_password_reset_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_customer ON public.password_reset USING btree (customer_id);


--
-- Name: idx_password_reset_token_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_token_hash ON public.password_reset USING btree (token_hash);


--
-- Name: idx_password_reset_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_user ON public.password_reset USING btree (user_id);


--
-- Name: idx_payment_mp_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_mp_id ON public.payment USING btree (mp_payment_id) WHERE (mp_payment_id IS NOT NULL);


--
-- Name: idx_payment_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_order ON public.payment USING btree (order_id);


--
-- Name: idx_trusted_device_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_trusted_device_hash ON public.trusted_device USING btree (token_hash);


--
-- Name: idx_trusted_device_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trusted_device_user ON public.trusted_device USING btree (user_id);


--
-- Name: image image_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image
    ADD CONSTRAINT image_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;


--
-- Name: inventory inventory_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.location(location_id) ON DELETE CASCADE;


--
-- Name: inventory inventory_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;


--
-- Name: order_detail order_detail_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_detail
    ADD CONSTRAINT order_detail_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE;


--
-- Name: order_detail order_detail_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_detail
    ADD CONSTRAINT order_detail_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE SET NULL;


--
-- Name: orders orders_cancelled_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_cancelled_by_user_id_fkey FOREIGN KEY (cancelled_by_user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE SET NULL;


--
-- Name: orders orders_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.location(location_id) ON DELETE SET NULL;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: password_reset password_reset_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset
    ADD CONSTRAINT password_reset_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE CASCADE;


--
-- Name: password_reset password_reset_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset
    ADD CONSTRAINT password_reset_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: payment payment_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE;


--
-- Name: product product_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.category(category_id) ON DELETE SET NULL;


--
-- Name: product product_laboratory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_laboratory_id_fkey FOREIGN KEY (laboratory_id) REFERENCES public.laboratory(laboratory_id) ON DELETE SET NULL;


--
-- Name: trusted_device trusted_device_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_device
    ADD CONSTRAINT trusted_device_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: users users_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.location(location_id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--



-- ============================================================
-- NORMALIZACIÓN FINAL  (añadido al dump real)
-- ------------------------------------------------------------
-- · Correos definitivos de staff y clientes (contraseñas intactas).
-- · Sólo 2 clientes (1 y 2); los demás del dump no se cargaron.
-- · 66 pedidos de demo (Jun 22–29, 2026) con order_detail y payment,
--   FKs íntegras y total_price consistente con los subtotales.
-- Datos transaccionales/transitorios del dump (orders, order_detail,
-- payment, password_reset, trusted_device) NO se cargaron: aquí se
-- generan los pedidos limpios desde cero.
-- ============================================================
SET search_path TO public;

-- Correos definitivos
UPDATE users    SET email = 'jeanarteaga.2020@gmail.com' WHERE user_code = 'ADMIN01';
UPDATE users    SET email = 'jeanfotosacc@gmail.com'      WHERE user_code = 'TRAB01';
UPDATE users    SET email = 'jeanarteaga.wsp@gmail.com'   WHERE user_code = 'TRAB02';
UPDATE customer SET email = 'ysantossiguenza@gmail.com'   WHERE customer_id = 1;
UPDATE customer SET email = 'veroarteaga.2012@gmail.com'  WHERE customer_id = 2;

-- Secuencias: pedidos arrancan en 1; clientes quedan en 2
SELECT setval('public.orders_order_id_seq',        1, false);
SELECT setval('public.order_detail_detail_id_seq', 1, false);
SELECT setval('public.payment_payment_id_seq',     1, false);
SELECT setval('public.customer_customer_id_seq',   2, true);

-- ============================================================
-- 66 PEDIDOS DEMO  (22→5, 23→7, 24→10, 25→9, 26→8, 27→7, 28→11, 29→9)
-- ============================================================
DO $$
DECLARE
  v_days     date[] := ARRAY['2026-06-22','2026-06-23','2026-06-24','2026-06-25',
                             '2026-06-26','2026-06-27','2026-06-28','2026-06-29']::date[];
  v_counts   int[]  := ARRAY[5,7,10,9,8,7,11,9];
  v_pay      text[] := ARRAY['efectivo','yape','plin','tarjeta','transferencia'];
  v_pool     int[];
  v_pool_len int;
  v_cust     int[];
  v_emp      int[];
  v_emp_loc  int[];
  n_emp      int;
  p_idx      int := 0;
  g_seq      int := 0;
  d int; i int; j int; n_items int;
  v_pid int; v_price numeric; v_amount int; v_sub numeric; v_total numeric;
  v_order_id int; v_cid int; v_loc int; v_user int;
  v_dtype text; v_state text; v_ts timestamp;
  v_addr text; v_phone text; v_email text;
BEGIN
  SELECT array_agg(customer_id ORDER BY customer_id) INTO v_cust FROM customer;
  IF COALESCE(array_length(v_cust,1),0) < 2 THEN
    RAISE EXCEPTION 'Se necesitan >=2 clientes'; END IF;

  SELECT array_agg(user_id ORDER BY user_id), array_agg(location_id ORDER BY user_id)
    INTO v_emp, v_emp_loc
  FROM users WHERE role = 'emp' AND location_id IS NOT NULL;
  n_emp := COALESCE(array_length(v_emp,1),0);
  IF n_emp < 1 THEN RAISE EXCEPTION 'Se necesita >=1 empleado con sede'; END IF;

  SELECT array_agg(product_id ORDER BY rn, category_id) INTO v_pool
  FROM (
    SELECT product_id, category_id,
           row_number() OVER (PARTITION BY category_id ORDER BY product_id) AS rn
    FROM product WHERE is_active = true AND product_price > 0
  ) s;
  v_pool_len := array_length(v_pool,1);

  FOR d IN 1 .. array_length(v_days,1) LOOP
    FOR i IN 1 .. v_counts[d] LOOP
      g_seq := g_seq + 1;
      v_cid   := v_cust[1 + (g_seq % 2)];
      v_user  := v_emp[1 + (g_seq % n_emp)];
      v_loc   := v_emp_loc[1 + (g_seq % n_emp)];
      v_dtype := CASE WHEN g_seq % 2 = 0 THEN 'delivery' ELSE 'pickup' END;
      n_items := (g_seq % 3) + 1;

      IF v_days[d] < DATE '2026-06-29' THEN
        v_state := 'entregado';
      ELSE
        IF    i <= 5 THEN v_state := 'entregado';
        ELSIF i <= 7 THEN v_state := 'en proceso';
        ELSE              v_state := 'pendiente';
        END IF;
      END IF;

      v_ts := (v_days[d] + TIME '09:00:00') + ((i - 1) * INTERVAL '37 minutes');

      SELECT address, phone, email INTO v_addr, v_phone, v_email
      FROM customer WHERE customer_id = v_cid;

      INSERT INTO orders (order_state, delivery_type, order_date, total_price,
                          delivery_address, delivery_phone, delivery_notes,
                          stock_discounted, customer_id, user_id, location_id)
      VALUES (v_state, v_dtype, v_ts, 0,
              CASE WHEN v_dtype='delivery' THEN v_addr  ELSE NULL END,
              CASE WHEN v_dtype='delivery' THEN v_phone ELSE NULL END,
              NULL, (v_state <> 'pendiente'), v_cid, v_user, v_loc)
      RETURNING order_id INTO v_order_id;

      v_total := 0;
      FOR j IN 1 .. n_items LOOP
        p_idx := p_idx + 1;
        v_pid := v_pool[((p_idx - 1) % v_pool_len) + 1];
        SELECT product_price INTO v_price FROM product WHERE product_id = v_pid;
        v_amount := 1 + ((g_seq + j) % 3);
        v_sub := v_price * v_amount;
        INSERT INTO order_detail (amount, unit_price, sub_total_price, product_id, order_id)
        VALUES (v_amount, v_price, v_sub, v_pid, v_order_id);
        v_total := v_total + v_sub;
      END LOOP;

      UPDATE orders SET total_price = v_total WHERE order_id = v_order_id;

      IF v_state <> 'pendiente' THEN
        INSERT INTO payment (payment_method, total_price, voucher_type, email_pay, order_id)
        VALUES (v_pay[1 + (g_seq % 5)], v_total,
                CASE WHEN g_seq % 2 = 0 THEN 'boleta' ELSE 'ticket' END,
                v_email, v_order_id);
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
SELECT 'Productos' AS tabla, COUNT(*) AS total FROM product
UNION ALL SELECT 'Imágenes',  COUNT(*) FROM image
UNION ALL SELECT 'Clientes',  COUNT(*) FROM customer
UNION ALL SELECT 'Usuarios',  COUNT(*) FROM users
UNION ALL SELECT 'Pedidos',   COUNT(*) FROM orders
UNION ALL SELECT 'Detalles',  COUNT(*) FROM order_detail
UNION ALL SELECT 'Pagos',     COUNT(*) FROM payment;

SELECT order_date::date AS dia, COUNT(*) AS pedidos
FROM orders GROUP BY order_date::date ORDER BY dia;

SELECT o.order_id, o.total_price, SUM(od.sub_total_price) AS suma
FROM orders o JOIN order_detail od ON od.order_id = o.order_id
GROUP BY o.order_id, o.total_price
HAVING o.total_price <> SUM(od.sub_total_price);   -- debe salir VACÍO
