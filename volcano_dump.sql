--
-- PostgreSQL database dump
--

-- Dumped from database version 16.1
-- Dumped by pg_dump version 16.1

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: company; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company (
    id integer NOT NULL,
    company_name character varying(120) NOT NULL,
    email character varying(120) NOT NULL,
    password_hash character varying(255),
    is_verified boolean,
    logo_url character varying(500),
    website_url character varying(200)
);


ALTER TABLE public.company OWNER TO postgres;

--
-- Name: company_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.company_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_id_seq OWNER TO postgres;

--
-- Name: company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.company_id_seq OWNED BY public.company.id;


--
-- Name: idea; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.idea (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    signal_type character varying(50),
    status character varying(20),
    is_useful boolean,
    potential_value character varying(50),
    tags character varying(200),
    created_at timestamp without time zone,
    sender_id integer NOT NULL,
    recipient_company_id integer NOT NULL,
    ai_analysis_log text
);


ALTER TABLE public.idea OWNER TO postgres;

--
-- Name: idea_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.idea_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.idea_id_seq OWNER TO postgres;

--
-- Name: idea_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.idea_id_seq OWNED BY public.idea.id;


--
-- Name: message; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.message (
    id integer NOT NULL,
    idea_id integer NOT NULL,
    sender_type character varying(10) NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone
);


ALTER TABLE public.message OWNER TO postgres;

--
-- Name: message_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.message_id_seq OWNER TO postgres;

--
-- Name: message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.message_id_seq OWNED BY public.message.id;


--
-- Name: user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."user" (
    id integer NOT NULL,
    username character varying(80) NOT NULL,
    name character varying(100),
    email character varying(120) NOT NULL,
    password_hash character varying(255),
    is_verified boolean
);


ALTER TABLE public."user" OWNER TO postgres;

--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_id_seq OWNER TO postgres;

--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- Name: company id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company ALTER COLUMN id SET DEFAULT nextval('public.company_id_seq'::regclass);


--
-- Name: idea id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.idea ALTER COLUMN id SET DEFAULT nextval('public.idea_id_seq'::regclass);


--
-- Name: message id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message ALTER COLUMN id SET DEFAULT nextval('public.message_id_seq'::regclass);


--
-- Name: user id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- Data for Name: company; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company (id, company_name, email, password_hash, is_verified, logo_url, website_url) FROM stdin;
1	VerifyCorp	contact@verifycorp.com	scrypt:32768:8:1$ttzkjc9IFJNzy3Hh$baa6ba11208f3125fd1012cadd95d9c4399b722c9fd4294d1b4a9b10219eee6b771214a9222afc0ad119cc6ca888dccbfbfafc08b450df7b829e260a2fa156b0	t	https://ui-avatars.com/api/?name=VerifyCorp&background=0D8ABC&color=fff&size=128	https://verifycorp.com
2	NeuroLink	info@neurolink.tech	scrypt:32768:8:1$wEkSzijJCa7CBcLq$5e3081eaa5528c8aba2f8308f72031b08ec1037808550c4b06cc68a0686c1fbe9e38080ea4e0235ebf441ef7e62bca9eda0e83455b2de70a1596d81c5e3bffef	t	https://ui-avatars.com/api/?name=NeuroLink&background=6D28D9&color=fff&size=128	https://neurolink.tech
3	Stripe Inc	support@stripe.com	scrypt:32768:8:1$P0DXTWpTbD9jFmpf$e2ec1bc268139eadb3ba28dece5585b3d3c54a5b8217d8bc6e9669c979cc45962d28b7c1797562bb0b46d4a7da45025113e9f94987a185e0ab228d6aad84703e	t	https://www.google.com/s2/favicons?domain=stripe.com&sz=128	https://stripe.com
4	Alpha Industries	alpha@industries.com	scrypt:32768:8:1$fwQm2krwYTV2DdKj$298e9967a413e83aba81e377467c26d807de0377882957cbf534e2cece78fd768ae5c5ac6885a0c1888f5c8caa403581905b01a6c0d8b9b15d752eba9dc85917	t	https://ui-avatars.com/api/?name=Alpha&background=ef4444&color=fff&size=128	https://alpha.com
5	Swiggy	partners@swiggy.com	scrypt:32768:8:1$jntIizsTISDaX5qp$26197cd9fda3ae0a24ced7411cbe8da5ece93d31e60d2f706d3ed08b5d79d6f4735491bbe0aeca2be3188634e189ae1ff3b883ee6c5d8807031dc7887155efe9	t	https://www.google.com/s2/favicons?domain=swiggy.com&sz=128	https://swiggy.com
6	Zepto	delivery@zepto.com	scrypt:32768:8:1$pgJN0sHoSK1mMp6b$36f7e80433b4082ad856fc50ae3c77abb3b4029e07daff2524bd217e6d1cd3ee01f8424f958ca98a4a658e1027527460385b3c7e304758acc904127772a4844b	t	https://www.google.com/s2/favicons?domain=zepto.com&sz=128	https://zeptonow.com
7	Antler	connect@antler.com	scrypt:32768:8:1$Zuu0Sf0xww58E5cm$31ac8b4665ca3dde3c4f93238790d82fb259779ef3b2a284506199a87be0d957dd55352e41b67d7b96310d0c82a41582621246d7846bbbcb468de48d51f5d10a	f	https://www.google.com/s2/favicons?domain=antler.co&sz=128	https://www.antler.co/
\.


--
-- Data for Name: idea; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.idea (id, title, content, signal_type, status, is_useful, potential_value, tags, created_at, sender_id, recipient_company_id, ai_analysis_log) FROM stdin;
1	hi	hello there, ive an idea with the your product	others	rejected	f	$362,000	Quantum Mechanics, Robotics	2026-01-21 17:52:09.314202	1	2	\N
2	Test Signal	This is a test signal for debugging purposes.	others	pending	f	$3805,000	Neuro-Link, Space Propulsion	2026-01-21 18:09:09.898416	2	3	\N
3	testing	test signals to test the messages	others	accepted	t	$4705,000	Bio-Tech, Cybernetics	2026-01-21 18:45:52.567357	1	4	\N
4	ts1	hihjewgcuh cmewv	others	rejected	f	$4060,000	Neuro-Link, Cybernetics	2026-01-21 18:48:00.343418	1	4	\N
5	testing	hello there, how are you, this is test 	others	accepted	t	$1483,000	AI Algorithms	2026-01-21 19:34:53.202041	4	2	\N
6	another	another test message	others	accepted	t	$2725,000	Cybernetics	2026-01-21 19:36:25.192606	4	2	\N
7	Badge Test	Testing badges	others	accepted	t	$4474,000	Cybernetics, Neuro-Link	2026-01-21 19:38:58.518379	3	5	\N
17	Test After Fix	This should work now.	New Feature	pending	f	$3916,000	AI Algorithms, Neuro-Link	2026-01-23 19:06:12.640196	8	4	\N
18	Browser Test Signal	Verifying UI works now.	New Feature	pending	f	$218,000	Bio-Tech	2026-01-23 19:09:17.765164	8	4	\N
20	test	ghbjhefgwbkfjbwkn wkjhfgebw lwhfiuh	New Feature	pending	f	$4605,000	Cybernetics, Robotics	2026-01-23 19:32:52.386017	10	6	\N
21	ubwjv	ioh uguyuwfkwc  ufhiunfkcs clihckcj ds	New Feature	rejected	f	$654,000	Neuro-Link	2026-01-23 19:33:09.087007	10	5	\N
22	Signal 1	Test Content 1	New Feature	accepted	t	$3017,000	Quantum Mechanics	2026-01-23 19:37:53.156329	11	5	\N
23	hi	uhifbwe okewogu kajkjgbsda	Bug	accepted	t	$368,000	AI Algorithms, Cybernetics	2026-01-23 19:41:16.445374	10	5	\N
24	dgfh	ghwtibag jhtgibvkm oeahgkj v	New Feature	accepted	t	$4278,000	Renewable Energy, Neuro-Link	2026-01-23 19:44:06.29389	10	5	\N
25	gibberish	laksjdflkasjdflkajs dflkjasdflkjas dflkjas dflkjasdf	New Feature	pending	t	$1,000	Manual Review	2026-01-27 09:05:24.477739	11	5	\N
26	Drone Delivery Network	Establish a hyper-local drone delivery network for 5-minute deliveries of essentials during peak traffic hours.	New Feature	pending	t	$1,000	Manual Review	2026-01-27 09:05:28.936339	11	5	\N
27	Food Delivery	You guys should deliver food to people houses using bikes. It would be cool.	New Feature	pending	t	$1,000	Manual Review	2026-01-27 09:05:34.020956	11	5	\N
28	gibberish	laksjdflkasjdflkajs dflkjasdflkjas dflkjas dflkjasdf	New Feature	pending	t	$1,000	Manual Review	2026-01-27 09:07:22.08271	11	5	\N
29	gibberish	laksjdflkasjdflkajs dflkjasdflkjas dflkjas dflkjasdf	New Feature	pending	t	$1,000	Manual Review	2026-01-27 09:09:54.565854	11	5	\N
30	Drone Delivery Network	Establish a hyper-local drone delivery network for 5-minute deliveries of essentials during peak traffic hours.	New Feature	pending	t	$1,000	Manual Review	2026-01-27 09:09:57.956511	11	5	\N
31	Food Delivery	You guys should deliver food to people houses using bikes. It would be cool.	New Feature	pending	t	$1,000	Manual Review	2026-01-27 09:10:01.683849	11	5	\N
32	gibberish	laksjdflkasjdflkajs dflkjasdflkjas dflkjas dflkjasdf	New Feature	pending	t	$1,000	Manual Review	2026-01-27 09:11:58.516681	11	5	\N
33	Drone Delivery Network	Establish a hyper-local drone delivery network for 5-minute deliveries of essentials during peak traffic hours.	New Feature	pending	t	$1,000	Manual Review	2026-01-27 09:12:01.393576	11	5	\N
34	Food Delivery	You guys should deliver food to people houses using bikes. It would be cool.	New Feature	pending	t	$1,000	Manual Review	2026-01-27 09:12:04.745212	11	5	\N
35	Telepathic Support	Use NeuralLink to allow customers to complain just by thinking about it.	New Feature	pending	t	$438,000	AI, Bio-Hacking	2026-01-27 09:13:58.773444	11	5	\N
36	Instamart Integration	You should add a quick grocery delivery service like Instamart if you are Swiggy.	New Feature	pending	t	$287,000	Quantum, Logistics	2026-01-27 09:14:01.695159	11	5	\N
37	Test of the garbage message	some garbage, hello	New Feature	pending	t	$30,000	Logistics, Bio-Hacking	2026-01-28 18:01:12.006427	12	5	\N
38	Holographic Dining Experience	Project 3D holograms of chefs preparing food on the table while customers wait.	New Feature	pending	t	$298,000	Bio-Hacking, Logistics	2026-01-28 18:08:45.768229	11	5	\N
39	Cancelled oRders	give the last minuite cancelled food for customer nearby delivery area at a discounted price.	New Feature	pending	t	$21,000	Consumer Tech, Quantum	2026-01-28 18:20:07.804535	12	5	\N
40	new orders	give the last minuite cancelled food for customer nearby delivery area at a dicounted price.	New Feature	pending	t	$65,000	Bio-Hacking, Logistics	2026-01-28 18:20:27.181066	12	5	\N
41	food orders	give the cancelled food for customer nearby delivery area at a lower price.	New Feature	pending	t	$51,000	AI, Consumer Tech	2026-01-28 18:23:30.538615	12	5	\N
42	Canceled order	send notification of cancelled food for customer nearby delivery.	New Feature	pending	t	$233,000	Bio-Hacking, Logistics	2026-01-28 18:25:40.65244	12	5	\N
43	Nearby customers	send notification of food/items orders for customer nearby delivery location at discounted price.	New Feature	pending	t	$302,000	AI, Consumer Tech	2026-01-28 18:26:56.200313	12	5	\N
44	Waste Food	For cancelled orders before delivery. sell those via popups to the customers who are nearby at lower price.	New Feature	pending	t	$273,000	Quantum, Consumer Tech	2026-02-01 13:26:08.010769	13	5	\N
45	Food Managment	Trigger: An order is canceled while the item is already prepared or the rider is in transit.\n\nGeofencing: The app identifies active users within a specific radius (e.g., 1–2km) of the item's current location.\n\nThe Offer: A high-urgency popup appears for those users: "Flash Deal! A fresh [Item] is nearby. Grab it in the next 5 minutes for 40% off!"	New Feature	pending	t	$409,000	AI, Quantum	2026-02-01 13:27:26.197643	13	5	\N
46	last minuite cancelling	An order is canceled while the item is already prepared or the rider is in transit.\nThe app identifies active users within a specific radius (e.g., 1–2km) of the item's current location.\n\nThe Offer: A high-urgency popup appears for those users: "Flash Deal! A fresh [Item] is nearby. Grab it in the next 5 minutes for 40% off! as it was cancelled by another one.	New Feature	pending	t	$261,000	Quantum, Consumer Tech	2026-02-01 13:32:20.930921	13	5	\N
47	Cancelled Packs	An order is canceled while the item is in about to deliver.\nThe app identifies active users within a specific radius (e.g., 1–2km) of the item's current location.\n\nThe Offer: A high-urgency popup appears for those users: "Flash Deal! A fresh [Item] is nearby. Grab it in the next 5 minutes for 40% off! as it was cancelled by another one.	New Feature	pending	t	$102,000	Logistics, Bio-Hacking	2026-02-01 13:33:29.445315	13	5	\N
48	rejecting the order	if food orders cancelled after ordering, and if the food is already prepared. we can sell that food to nearby users by offering at discount.	New Feature	pending	t	$378,000	Consumer Tech, AI	2026-02-01 13:38:00.435591	13	5	\N
49	Not showing up while delivery	if food orders cancelled after ordering, and if the delivery boy is trying to call and customer not picking the call . we can sell that food to nearby users by offering at discount.	New Feature	pending	t	$108,000	Quantum, Consumer Tech	2026-02-01 13:41:45.606767	13	5	\N
50	Timeless delive	jgvhjbvu wguybkvj jgvhjbvu wguybkvjjgvhjbvu wguybkvjjgvhjbvu wguybkvjjgvhjbvu wguybkvjjgvhjbvu wguybkvjjgvhjbvu wguybkvjjgvhjbvu wguybkvjjgvhjbvu wguybkvjjgvhjbvu wguybkvjjgvhjbvu wguybkvjjgvhjbvu wguybkvjjgvhjbvu wguybkvjjgvhjbvu wguybkvjjgvhjbvu wguybkvjjgvhjbvu wguybkvjjgvhjbvu wguybkvjjgvhjbvu wguybkvjjgvhjbvu wguybkvjjgvhjbvu wguybkvjjgvhjbvu wguybkvjjgvhjbvu wguybkvjjgvhjbvu wguybkvj	Bug	volcano_rejected	f	Analyzing...	Verifying...	2026-02-02 03:23:08.559559	13	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[1.7s] WARNING: No JSON found in response. Raw: ```\n\n[1.7s] RESULT: Rejected: AI Output Malformed (No JSON)\n\n[FINAL REJECTION REASON]: AI Output Malformed (No JSON)
51	Testing	testing of the application	New Feature	volcano_rejected	f	Analyzing...	Verifying...	2026-02-02 05:15:38.407564	13	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[5.1s] ERROR: Super Agent Failed: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.', 'status': 'RESOURCE_EXHAUSTED'}}\n\n[FINAL REJECTION REASON]: System Error: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.', 'status': 'RESOURCE_EXHAUSTED'}}
52	test	this is just a normal message	New Feature	volcano_rejected	f	Analyzing...	Verifying...	2026-02-02 05:37:12.207164	13	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[1.8s] ERROR: Super Agent Failed: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.', 'status': 'RESOURCE_EXHAUSTED'}}\n\n[FINAL REJECTION REASON]: System Error: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.', 'status': 'RESOURCE_EXHAUSTED'}}
53	test	testing a message	New Feature	volcano_rejected	f	Analyzing...	Verifying...	2026-02-02 05:41:35.91323	13	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[2.5s] RESULT: Rejected: The provided signal appears to be a generic test message, lacking a concrete, actionable idea for a company to implement. It does not present a novel feature, improvement, or business strategy. Therefore, it is categorized as 'not a valid idea'.\n\n[FINAL REJECTION REASON]: The provided signal appears to be a generic test message, lacking a concrete, actionable idea for a company to implement. It does not present a novel feature, improvement, or business strategy. Therefore, it is categorized as 'not a valid idea'.
54	test	this is a test message	New Feature	volcano_rejected	f	Analyzing...	Verifying...	2026-02-02 05:47:14.231492	13	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[2.6s] RESULT: Rejected: The signal content indicates this is a test message, which does not represent a valid or novel idea.\n\n[FINAL REJECTION REASON]: The signal content indicates this is a test message, which does not represent a valid or novel idea.
55	test	testing the feature	New Feature	volcano_rejected	f	Analyzing...	Verifying...	2026-02-02 05:53:49.124332	13	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[2.3s] ERROR: Super Agent Failed: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.', 'status': 'RESOURCE_EXHAUSTED'}}\n\n[FINAL REJECTION REASON]: System Error: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.', 'status': 'RESOURCE_EXHAUSTED'}}
56	testing	this is just a simple message	New Feature	volcano_rejected	f	Analyzing...	Verifying...	2026-02-02 05:56:43.01273	13	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[2.4s] ERROR: Super Agent Failed: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.', 'status': 'RESOURCE_EXHAUSTED'}}\n\n[FINAL REJECTION REASON]: System Error: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.', 'status': 'RESOURCE_EXHAUSTED'}}
57	Hello	hello there, a test message	New Feature	volcano_rejected	f	Analyzing...	Verifying...	2026-02-02 11:06:27.121744	13	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[2.0s] ERROR: Super Agent Failed: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.', 'status': 'RESOURCE_EXHAUSTED'}}\n\n[FINAL REJECTION REASON]: System Error: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.', 'status': 'RESOURCE_EXHAUSTED'}}
58	New Idea	a new idea	New Feature	volcano_rejected	f	Analyzing...	Verifying...	2026-02-09 08:06:02.440598	13	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[1.3s] ERROR: Super Agent Failed: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\nPlease retry in 57.332296767s.', 'status': 'RESOURCE_EXHAUSTED', 'details': [{'@type': 'type.googleapis.com/google.rpc.Help', 'links': [{'description': 'Learn more about Gemini API quotas', 'url': 'https://ai.google.dev/gemini-api/docs/rate-limits'}]}, {'@type': 'type.googleapis.com/google.rpc.QuotaFailure', 'violations': [{'quotaMetric': 'generativelanguage.googleapis.com/generate_content_free_tier_requests', 'quotaId': 'GenerateRequestsPerDayPerProjectPerModel-FreeTier', 'quotaDimensions': {'location': 'global', 'model': 'gemini-2.0-flash'}}, {'quotaMetric': 'generativelanguage.googleapis.com/generate_content_free_tier_requests', 'quotaId': 'GenerateRequestsPerMinutePerProjectPerModel-FreeTier', 'quotaDimensions': {'location': 'global', 'model': 'gemini-2.0-flash'}}, {'quotaMetric': 'generativelanguage.googleapis.com/generate_content_free_tier_input_token_count', 'quotaId': 'GenerateContentInputTokensPerModelPerMinute-FreeTier', 'quotaDimensions': {'model': 'gemini-2.0-flash', 'location': 'global'}}]}, {'@type': 'type.googleapis.com/google.rpc.RetryInfo', 'retryDelay': '57s'}]}}\n\n[FINAL REJECTION REASON]: System Error: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\nPlease retry in 57.332296767s.', 'status': 'RESOURCE_EXHAUSTED', 'details': [{'@type': 'type.googleapis.com/google.rpc.Help', 'links': [{'description': 'Learn more about Gemini API quotas', 'url': 'https://ai.google.dev/gemini-api/docs/rate-limits'}]}, {'@type': 'type.googleapis.com/google.rpc.QuotaFailure', 'violations': [{'quotaMetric': 'generativelanguage.googleapis.com/generate_content_free_tier_requests', 'quotaId': 'GenerateRequestsPerDayPerProjectPerModel-FreeTier', 'quotaDimensions': {'location': 'global', 'model': 'gemini-2.0-flash'}}, {'quotaMetric': 'generativelanguage.googleapis.com/generate_content_free_tier_requests', 'quotaId': 'GenerateRequestsPerMinutePerProjectPerModel-FreeTier', 'quotaDimensions': {'location': 'global', 'model': 'gemini-2.0-flash'}}, {'quotaMetric': 'generativelanguage.googleapis.com/generate_content_free_tier_input_token_count', 'quotaId': 'GenerateContentInputTokensPerModelPerMinute-FreeTier', 'quotaDimensions': {'model': 'gemini-2.0-flash', 'location': 'global'}}]}, {'@type': 'type.googleapis.com/google.rpc.RetryInfo', 'retryDelay': '57s'}]}}
59	Test idea	test idea	New Feature	volcano_rejected	f	Analyzing...	Verifying...	2026-02-09 08:16:32.128918	13	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[0.4s] ERROR: Super Agent Failed: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\nPlease retry in 28.349197622s.', 'status': 'RESOURCE_EXHAUSTED', 'details': [{'@type': 'type.googleapis.com/google.rpc.Help', 'links': [{'description': 'Learn more about Gemini API quotas', 'url': 'https://ai.google.dev/gemini-api/docs/rate-limits'}]}, {'@type': 'type.googleapis.com/google.rpc.QuotaFailure', 'violations': [{'quotaMetric': 'generativelanguage.googleapis.com/generate_content_free_tier_input_token_count', 'quotaId': 'GenerateContentInputTokensPerModelPerMinute-FreeTier', 'quotaDimensions': {'location': 'global', 'model': 'gemini-2.0-flash'}}, {'quotaMetric': 'generativelanguage.googleapis.com/generate_content_free_tier_requests', 'quotaId': 'GenerateRequestsPerMinutePerProjectPerModel-FreeTier', 'quotaDimensions': {'location': 'global', 'model': 'gemini-2.0-flash'}}, {'quotaMetric': 'generativelanguage.googleapis.com/generate_content_free_tier_requests', 'quotaId': 'GenerateRequestsPerDayPerProjectPerModel-FreeTier', 'quotaDimensions': {'location': 'global', 'model': 'gemini-2.0-flash'}}]}, {'@type': 'type.googleapis.com/google.rpc.RetryInfo', 'retryDelay': '28s'}]}}\n\n[FINAL REJECTION REASON]: System Error: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\nPlease retry in 28.349197622s.', 'status': 'RESOURCE_EXHAUSTED', 'details': [{'@type': 'type.googleapis.com/google.rpc.Help', 'links': [{'description': 'Learn more about Gemini API quotas', 'url': 'https://ai.google.dev/gemini-api/docs/rate-limits'}]}, {'@type': 'type.googleapis.com/google.rpc.QuotaFailure', 'violations': [{'quotaMetric': 'generativelanguage.googleapis.com/generate_content_free_tier_input_token_count', 'quotaId': 'GenerateContentInputTokensPerModelPerMinute-FreeTier', 'quotaDimensions': {'location': 'global', 'model': 'gemini-2.0-flash'}}, {'quotaMetric': 'generativelanguage.googleapis.com/generate_content_free_tier_requests', 'quotaId': 'GenerateRequestsPerMinutePerProjectPerModel-FreeTier', 'quotaDimensions': {'location': 'global', 'model': 'gemini-2.0-flash'}}, {'quotaMetric': 'generativelanguage.googleapis.com/generate_content_free_tier_requests', 'quotaId': 'GenerateRequestsPerDayPerProjectPerModel-FreeTier', 'quotaDimensions': {'location': 'global', 'model': 'gemini-2.0-flash'}}]}, {'@type': 'type.googleapis.com/google.rpc.RetryInfo', 'retryDelay': '28s'}]}}
60	Test	test	New Feature	volcano_rejected	f	Analyzing...	Verifying...	2026-02-09 08:18:48.44836	13	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[1.0s] ERROR: Super Agent Failed: 400 INVALID_ARGUMENT. {'error': {'code': 400, 'message': 'Unable to submit request because controlled generation is not supported with Search tool. Learn more: https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/gemini', 'status': 'INVALID_ARGUMENT'}}\n\n[FINAL REJECTION REASON]: System Error: 400 INVALID_ARGUMENT. {'error': {'code': 400, 'message': 'Unable to submit request because controlled generation is not supported with Search tool. Learn more: https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/gemini', 'status': 'INVALID_ARGUMENT'}}
61	test	test	New Feature	volcano_rejected	f	Analyzing...	Verifying...	2026-02-09 08:47:19.764012	13	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[1.8s] WARNING: JSON Parse Failed. Raw Output: \n[1.8s] RESULT: Rejected: AI Output Malformed\n\n[FINAL REJECTION REASON]: AI Output Malformed
62	test	test	New Feature	volcano_rejected	f	Analyzing...	Verifying...	2026-02-09 08:54:34.013794	13	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[3.0s] RESULT: Rejected: The signal content is too generic to be evaluated as a valid idea.\n\n[FINAL REJECTION REASON]: The signal content is too generic to be evaluated as a valid idea.
63	test	this is an idea, u can send to it	New Feature	volcano_rejected	f	Analyzing...	Verifying...	2026-02-09 08:55:18.921643	13	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[3.6s] RESULT: Rejected: The signal content is too generic and does not provide any specific idea to validate. It simply states 'this is an idea, u can send to it', lacking the necessary details for assessing novelty or potential value.\n\n[FINAL REJECTION REASON]: The signal content is too generic and does not provide any specific idea to validate. It simply states 'this is an idea, u can send to it', lacking the necessary details for assessing novelty or potential value.
65	sell food	sell food	New Feature	volcano_rejected	f	Analyzing...	Verifying...	2026-02-09 09:02:02.500257	13	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[3.6s] ERROR: Super Agent Failed: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.', 'status': 'RESOURCE_EXHAUSTED'}}\n\n[FINAL REJECTION REASON]: System Error: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.', 'status': 'RESOURCE_EXHAUSTED'}}
66	Treshhold	User needs to be notified when no of delivery treshold reached for particular month	New Feature	rejected	f	Analyzing...	delivery, threshold, notification, user experience	2026-02-09 13:11:10.248104	14	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[2.7s] STEP 7-8: Strategic Value Confirmed: The idea of notifying users about delivery threshold is novel and beneficial. Many delivery services already offer notifications, implementing a monthly threshold notification could improve user experience by helping users manage their deliveries and potentially avoid exceeding limits or incurring extra costs.\n[2.7s] RESULT: Good Idea - Sending to Boardroom
67	Cart details	User should have ability to create profile specific cart in Same account. For example,user may have different priorities at different fields, user should have specific profile section within cart such as grocerry, food, office etc and this is not as default this is purely optional	New Feature	volcano_rejected	f	Analyzing...	Verifying...	2026-02-09 13:22:06.529796	14	6	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[2.5s] ERROR: Super Agent Failed: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.', 'status': 'RESOURCE_EXHAUSTED'}}\n\n[FINAL REJECTION REASON]: System Error: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.', 'status': 'RESOURCE_EXHAUSTED'}}
68	Debug Signal Test	Testing if the volcano thread starts correctly.	debug	volcano_rejected	f	Debugging...	Debug	2026-02-09 13:26:04.499518	1	1	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[2.1s] RESULT: Rejected: The signal is a test signal for debugging purposes, which is an internal process and not a novel idea for a company to implement as a new feature or service.\n\n[FINAL REJECTION REASON]: The signal is a test signal for debugging purposes, which is an internal process and not a novel idea for a company to implement as a new feature or service.
69	test	test message	New Feature	volcano_rejected	f	Analyzing...	Verifying...	2026-02-09 13:52:55.068927	14	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[3.0s] ERROR: Super Agent Failed: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.', 'status': 'RESOURCE_EXHAUSTED'}}\n\n[FINAL REJECTION REASON]: System Error: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.', 'status': 'RESOURCE_EXHAUSTED'}}
70	test	test	New Feature	volcano_rejected	f	Analyzing...	Verifying...	2026-02-09 13:57:43.280569	14	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[3.9s] RESULT: Rejected: The signal is too vague and does not present a specific or actionable idea.\n\n[FINAL REJECTION REASON]: The signal is too vague and does not present a specific or actionable idea.
71	cart Profiles	User should have ability to create profile specific cart in Same account. For example,user may have different priorities at different fields, user should have specific profile section within cart such as grocerry, food, office etc and this is not as default this is purely optional	New Feature	rejected	f	Analyzing...	shopping cart, user profile, personalization, e-commerce, feature request	2026-02-09 13:58:47.943907	14	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[4.2s] STEP 7-8: Strategic Value Confirmed: The idea of user-specific cart profiles within a single account is a valid and potentially useful feature. While some existing shopping cart systems and platforms offer features like multiple user profiles or the ability to manage multiple stores, the specific concept of creating customizable cart profiles (e.g., 'grocery,' 'food,' 'office') within a single user account for different purchasing priorities appears novel. This feature could enhance user experience by allowing for better organization and management of shopping needs, thereby improving customer satisfaction and potentially increasing sales.\n[4.2s] RESULT: Good Idea - Sending to Boardroom
72	test	User should have ability to create profile specific cart in Same account. For example,user may have different priorities at different fields, user should have specific profile section within cart such as grocerry, food, office etc and this is not as default this is purely optional	New Feature	rejected	f	Analyzing...	e-commerce, shopping cart, user experience, personalization	2026-02-09 14:11:43.930339	14	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[8.9s] STEP 7-8: Strategic Value Confirmed: The idea is valid because it enhances user experience by allowing profile-specific carts, addressing different shopping needs within a single account. While some solutions exist, this feature is not standard and provides added value.\n[8.9s] RESULT: Good Idea - Sending to Boardroom
73	test	User should have ability to create profile specific cart in Same account. For example,user may have different priorities at different fields, user should have specific profile section within cart such as grocerry, food, office etc and this is not as default this is purely optional\n	New Feature	volcano_rejected	f	Analyzing...	Verifying...	2026-02-09 14:17:23.206919	14	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[0.8s] ERROR: Super Agent Failed: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.', 'status': 'RESOURCE_EXHAUSTED'}}\n\n[FINAL REJECTION REASON]: System Error: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.', 'status': 'RESOURCE_EXHAUSTED'}}
74	testing	User should have ability to create profile specific cart in Same account. For example,user may have different priorities at different fields, user should have specific profile section within cart such as grocerry, food, office etc and this is not as default this is purely optional\n	New Feature	volcano_rejected	f	Analyzing...	Verifying...	2026-02-09 14:23:20.630465	14	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[0.4s] ERROR: Super Agent Failed: 400 INVALID_ARGUMENT. {'error': {'code': 400, 'message': 'API key expired. Please renew the API key.', 'status': 'INVALID_ARGUMENT', 'details': [{'@type': 'type.googleapis.com/google.rpc.ErrorInfo', 'reason': 'API_KEY_INVALID', 'domain': 'googleapis.com', 'metadata': {'service': 'generativelanguage.googleapis.com'}}, {'@type': 'type.googleapis.com/google.rpc.LocalizedMessage', 'locale': 'en-US', 'message': 'API key expired. Please renew the API key.'}]}}\n\n[FINAL REJECTION REASON]: System Error: 400 INVALID_ARGUMENT. {'error': {'code': 400, 'message': 'API key expired. Please renew the API key.', 'status': 'INVALID_ARGUMENT', 'details': [{'@type': 'type.googleapis.com/google.rpc.ErrorInfo', 'reason': 'API_KEY_INVALID', 'domain': 'googleapis.com', 'metadata': {'service': 'generativelanguage.googleapis.com'}}, {'@type': 'type.googleapis.com/google.rpc.LocalizedMessage', 'locale': 'en-US', 'message': 'API key expired. Please renew the API key.'}]}}
75	testing	User should have ability to create profile specific cart in Same account. For example,user may have different priorities at different fields, user should have specific profile section within cart such as grocerry, food, office etc and this is not as default this is purely optional\n	New Feature	volcano_rejected	f	Analyzing...	Verifying...	2026-02-09 14:23:44.606607	14	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[0.2s] ERROR: Super Agent Failed: 400 INVALID_ARGUMENT. {'error': {'code': 400, 'message': 'API key expired. Please renew the API key.', 'status': 'INVALID_ARGUMENT', 'details': [{'@type': 'type.googleapis.com/google.rpc.ErrorInfo', 'reason': 'API_KEY_INVALID', 'domain': 'googleapis.com', 'metadata': {'service': 'generativelanguage.googleapis.com'}}, {'@type': 'type.googleapis.com/google.rpc.LocalizedMessage', 'locale': 'en-US', 'message': 'API key expired. Please renew the API key.'}]}}\n\n[FINAL REJECTION REASON]: System Error: 400 INVALID_ARGUMENT. {'error': {'code': 400, 'message': 'API key expired. Please renew the API key.', 'status': 'INVALID_ARGUMENT', 'details': [{'@type': 'type.googleapis.com/google.rpc.ErrorInfo', 'reason': 'API_KEY_INVALID', 'domain': 'googleapis.com', 'metadata': {'service': 'generativelanguage.googleapis.com'}}, {'@type': 'type.googleapis.com/google.rpc.LocalizedMessage', 'locale': 'en-US', 'message': 'API key expired. Please renew the API key.'}]}}
76	test message	this is just  text message	New Feature	volcano_rejected	f	Analyzing...	Verifying...	2026-02-09 15:09:48.186979	13	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[0.8s] ERROR: Super Agent Failed: 400 INVALID_ARGUMENT. {'error': {'code': 400, 'message': 'API key expired. Please renew the API key.', 'status': 'INVALID_ARGUMENT', 'details': [{'@type': 'type.googleapis.com/google.rpc.ErrorInfo', 'reason': 'API_KEY_INVALID', 'domain': 'googleapis.com', 'metadata': {'service': 'generativelanguage.googleapis.com'}}, {'@type': 'type.googleapis.com/google.rpc.LocalizedMessage', 'locale': 'en-US', 'message': 'API key expired. Please renew the API key.'}]}}\n\n[FINAL REJECTION REASON]: System Error: 400 INVALID_ARGUMENT. {'error': {'code': 400, 'message': 'API key expired. Please renew the API key.', 'status': 'INVALID_ARGUMENT', 'details': [{'@type': 'type.googleapis.com/google.rpc.ErrorInfo', 'reason': 'API_KEY_INVALID', 'domain': 'googleapis.com', 'metadata': {'service': 'generativelanguage.googleapis.com'}}, {'@type': 'type.googleapis.com/google.rpc.LocalizedMessage', 'locale': 'en-US', 'message': 'API key expired. Please renew the API key.'}]}}
77	test	hello thete	New Feature	volcano_rejected	f	Analyzing...	Verifying...	2026-02-09 15:12:04.786715	13	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[0.3s] ERROR: Super Agent Failed: 400 INVALID_ARGUMENT. {'error': {'code': 400, 'message': 'API key expired. Please renew the API key.', 'status': 'INVALID_ARGUMENT', 'details': [{'@type': 'type.googleapis.com/google.rpc.ErrorInfo', 'reason': 'API_KEY_INVALID', 'domain': 'googleapis.com', 'metadata': {'service': 'generativelanguage.googleapis.com'}}, {'@type': 'type.googleapis.com/google.rpc.LocalizedMessage', 'locale': 'en-US', 'message': 'API key expired. Please renew the API key.'}]}}\n\n[FINAL REJECTION REASON]: System Error: 400 INVALID_ARGUMENT. {'error': {'code': 400, 'message': 'API key expired. Please renew the API key.', 'status': 'INVALID_ARGUMENT', 'details': [{'@type': 'type.googleapis.com/google.rpc.ErrorInfo', 'reason': 'API_KEY_INVALID', 'domain': 'googleapis.com', 'metadata': {'service': 'generativelanguage.googleapis.com'}}, {'@type': 'type.googleapis.com/google.rpc.LocalizedMessage', 'locale': 'en-US', 'message': 'API key expired. Please renew the API key.'}]}}
64	test idea	this an idea, where swiggy can sell the orders or food which is cancelled just before delivery.\n\nso those items can be shown up to near by swiggy users and sell them at some discounted price.	New Feature	accepted	t	Analyzing...	food waste, revenue generation, discounts, customer acquisition	2026-02-09 08:57:34.317111	13	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[5.2s] STEP 7-8: Strategic Value Confirmed: The idea proposes a novel approach to reduce food waste and recover revenue from cancelled orders by offering them at a discount to nearby users. This could benefit Swiggy financially and improve its brand image.\n[5.2s] RESULT: Good Idea - Sending to Boardroom
78	test	test message	New Feature	volcano_rejected	f	Queued...	Pending Analysis...	2026-02-14 05:24:07.30112	17	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[3.0s] RESULT: Rejected: The signal content 'test message' is too generic and lacks a specific, novel idea for improvement or innovation. It could be a normal message or spam.\n\n[FINAL REJECTION REASON]: The signal content 'test message' is too generic and lacks a specific, novel idea for improvement or innovation. It could be a normal message or spam.
79	Cancelled ORder	this an idea, where swiggy can sell the orders or food which is cancelled just before delivery. so those items can be shown up to near by swiggy users and sell them at some discounted price.	New Feature	volcano_rejected	f	Queued...	Pending Analysis...	2026-02-14 05:27:34.784548	13	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[3.1s] RESULT: Rejected: Zomato has already implemented a similar feature.\n\n[FINAL REJECTION REASON]: Zomato has already implemented a similar feature.
80	MULTIPLE CARTS	User should have ability to create profile specific cart in Same account. For example,user may have different priorities at different fields, user should have specific profile section within cart such as grocerry, food, office etc and this is not as default this is purely optional	New Feature	volcano_rejected	f	Queued...	Pending Analysis...	2026-02-14 05:30:27.032788	14	5	[0.0s] Thinking Engine: Initializing Single Super-Agent...\n[0.0s] STEP 1-2: Reading & Validating Signal...\n[0.0s] STEP 5: Checking External Knowledge (Google Search)...\n[6.1s] ERROR: Super Agent Failed: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.', 'status': 'RESOURCE_EXHAUSTED'}}\n\n[FINAL REJECTION REASON]: System Error: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.', 'status': 'RESOURCE_EXHAUSTED'}}
\.


--
-- Data for Name: message; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.message (id, idea_id, sender_type, content, created_at) FROM stdin;
14	58	volcano	COGNITIVE CORE ALERT: System Error: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\nPlease retry in 57.332296767s.', 'status': 'RESOURCE_EXHAUSTED', 'details': [{'@type': 'type.googleapis.com/google.rpc.Help', 'links': [{'description': 'Learn more about Gemini API quotas', 'url': 'https://ai.google.dev/gemini-api/docs/rate-limits'}]}, {'@type': 'type.googleapis.com/google.rpc.QuotaFailure', 'violations': [{'quotaMetric': 'generativelanguage.googleapis.com/generate_content_free_tier_requests', 'quotaId': 'GenerateRequestsPerDayPerProjectPerModel-FreeTier', 'quotaDimensions': {'location': 'global', 'model': 'gemini-2.0-flash'}}, {'quotaMetric': 'generativelanguage.googleapis.com/generate_content_free_tier_requests', 'quotaId': 'GenerateRequestsPerMinutePerProjectPerModel-FreeTier', 'quotaDimensions': {'location': 'global', 'model': 'gemini-2.0-flash'}}, {'quotaMetric': 'generativelanguage.googleapis.com/generate_content_free_tier_input_token_count', 'quotaId': 'GenerateContentInputTokensPerModelPerMinute-FreeTier', 'quotaDimensions': {'model': 'gemini-2.0-flash', 'location': 'global'}}]}, {'@type': 'type.googleapis.com/google.rpc.RetryInfo', 'retryDelay': '57s'}]}}	2026-02-09 08:06:04.044875
15	59	volcano	COGNITIVE CORE ALERT: System Error: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\nPlease retry in 28.349197622s.', 'status': 'RESOURCE_EXHAUSTED', 'details': [{'@type': 'type.googleapis.com/google.rpc.Help', 'links': [{'description': 'Learn more about Gemini API quotas', 'url': 'https://ai.google.dev/gemini-api/docs/rate-limits'}]}, {'@type': 'type.googleapis.com/google.rpc.QuotaFailure', 'violations': [{'quotaMetric': 'generativelanguage.googleapis.com/generate_content_free_tier_input_token_count', 'quotaId': 'GenerateContentInputTokensPerModelPerMinute-FreeTier', 'quotaDimensions': {'location': 'global', 'model': 'gemini-2.0-flash'}}, {'quotaMetric': 'generativelanguage.googleapis.com/generate_content_free_tier_requests', 'quotaId': 'GenerateRequestsPerMinutePerProjectPerModel-FreeTier', 'quotaDimensions': {'location': 'global', 'model': 'gemini-2.0-flash'}}, {'quotaMetric': 'generativelanguage.googleapis.com/generate_content_free_tier_requests', 'quotaId': 'GenerateRequestsPerDayPerProjectPerModel-FreeTier', 'quotaDimensions': {'location': 'global', 'model': 'gemini-2.0-flash'}}]}, {'@type': 'type.googleapis.com/google.rpc.RetryInfo', 'retryDelay': '28s'}]}}	2026-02-09 08:16:32.615883
16	60	volcano	COGNITIVE CORE ALERT: System Error: 400 INVALID_ARGUMENT. {'error': {'code': 400, 'message': 'Unable to submit request because controlled generation is not supported with Search tool. Learn more: https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/gemini', 'status': 'INVALID_ARGUMENT'}}	2026-02-09 08:18:49.429649
17	61	volcano	COGNITIVE CORE ALERT: AI Output Malformed	2026-02-09 08:47:21.61152
18	62	volcano	COGNITIVE CORE ALERT: The signal content is too generic to be evaluated as a valid idea.	2026-02-09 08:54:37.033345
19	63	volcano	COGNITIVE CORE ALERT: The signal content is too generic and does not provide any specific idea to validate. It simply states 'this is an idea, u can send to it', lacking the necessary details for assessing novelty or potential value.	2026-02-09 08:55:22.537238
20	64	titan	can you elaborate it please	2026-02-09 08:59:07.59699
21	65	volcano	COGNITIVE CORE ALERT: System Error: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.', 'status': 'RESOURCE_EXHAUSTED'}}	2026-02-09 09:02:06.095086
22	67	alien	hello	2026-02-09 13:28:19.711949
23	66	alien	hello	2026-02-09 13:28:41.130234
24	69	volcano	COGNITIVE CORE ALERT: System Error: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.', 'status': 'RESOURCE_EXHAUSTED'}}	2026-02-09 13:52:58.151934
25	70	volcano	COGNITIVE CORE ALERT: The signal is too vague and does not present a specific or actionable idea.	2026-02-09 13:57:47.282796
26	71	titan	Hello	2026-02-09 14:00:37.858569
27	72	titan	hello	2026-02-09 14:12:51.071719
28	72	alien	hello	2026-02-09 14:16:30.895934
29	73	volcano	COGNITIVE CORE ALERT: System Error: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.', 'status': 'RESOURCE_EXHAUSTED'}}	2026-02-09 14:17:24.083305
30	73	alien	hello	2026-02-09 14:19:26.223791
31	74	volcano	COGNITIVE CORE ALERT: System Error: 400 INVALID_ARGUMENT. {'error': {'code': 400, 'message': 'API key expired. Please renew the API key.', 'status': 'INVALID_ARGUMENT', 'details': [{'@type': 'type.googleapis.com/google.rpc.ErrorInfo', 'reason': 'API_KEY_INVALID', 'domain': 'googleapis.com', 'metadata': {'service': 'generativelanguage.googleapis.com'}}, {'@type': 'type.googleapis.com/google.rpc.LocalizedMessage', 'locale': 'en-US', 'message': 'API key expired. Please renew the API key.'}]}}	2026-02-09 14:23:21.041288
32	75	volcano	COGNITIVE CORE ALERT: System Error: 400 INVALID_ARGUMENT. {'error': {'code': 400, 'message': 'API key expired. Please renew the API key.', 'status': 'INVALID_ARGUMENT', 'details': [{'@type': 'type.googleapis.com/google.rpc.ErrorInfo', 'reason': 'API_KEY_INVALID', 'domain': 'googleapis.com', 'metadata': {'service': 'generativelanguage.googleapis.com'}}, {'@type': 'type.googleapis.com/google.rpc.LocalizedMessage', 'locale': 'en-US', 'message': 'API key expired. Please renew the API key.'}]}}	2026-02-09 14:23:44.836186
33	71	alien	hello there	2026-02-09 14:31:29.084358
34	71	titan	hi	2026-02-09 14:31:43.1043
35	71	alien	how	2026-02-09 14:31:47.181851
36	76	volcano	COGNITIVE CORE ALERT: System Error: 400 INVALID_ARGUMENT. {'error': {'code': 400, 'message': 'API key expired. Please renew the API key.', 'status': 'INVALID_ARGUMENT', 'details': [{'@type': 'type.googleapis.com/google.rpc.ErrorInfo', 'reason': 'API_KEY_INVALID', 'domain': 'googleapis.com', 'metadata': {'service': 'generativelanguage.googleapis.com'}}, {'@type': 'type.googleapis.com/google.rpc.LocalizedMessage', 'locale': 'en-US', 'message': 'API key expired. Please renew the API key.'}]}}	2026-02-09 15:09:49.718341
37	77	volcano	COGNITIVE CORE ALERT: System Error: 400 INVALID_ARGUMENT. {'error': {'code': 400, 'message': 'API key expired. Please renew the API key.', 'status': 'INVALID_ARGUMENT', 'details': [{'@type': 'type.googleapis.com/google.rpc.ErrorInfo', 'reason': 'API_KEY_INVALID', 'domain': 'googleapis.com', 'metadata': {'service': 'generativelanguage.googleapis.com'}}, {'@type': 'type.googleapis.com/google.rpc.LocalizedMessage', 'locale': 'en-US', 'message': 'API key expired. Please renew the API key.'}]}}	2026-02-09 15:12:05.241065
38	64	alien	helo there	2026-02-09 15:20:09.463635
39	64	alien	hi	2026-02-09 15:20:34.65112
40	64	titan	hello	2026-02-09 15:20:39.776077
41	78	volcano	COGNITIVE CORE ALERT: The signal content 'test message' is too generic and lacks a specific, novel idea for improvement or innovation. It could be a normal message or spam.	2026-02-14 05:24:11.017172
42	79	volcano	COGNITIVE CORE ALERT: Zomato has already implemented a similar feature.	2026-02-14 05:27:38.247961
43	80	volcano	COGNITIVE CORE ALERT: System Error: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.', 'status': 'RESOURCE_EXHAUSTED'}}	2026-02-14 05:30:34.296981
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."user" (id, username, name, email, password_hash, is_verified) FROM stdin;
1	ALIEN-2U1M	\N	alien@gmail.com	scrypt:32768:8:1$ETAyWyeX4MYNOio0$59dada31739de0d003e8c59af10de86db9902a1b0876151a8543a2f44b928f68d3ec286f3d04f9dbe4d47195a4123dc878a4f3ee44ef576414c6123993881766	f
2	ALIEN-65SK	\N	alien@space.com	scrypt:32768:8:1$hR7nmwkqDd7dXo5M$3dba0721af04f3388190de4049c4f07f8a5908d402c4bf6bbc0038543a5b15d08a35bfa43ade250683885cbbe62d76d7c2bb4a6b6565e1d15f2261cb2d637627	f
3	ALIEN-A189	\N	badgealien@valcano.com	scrypt:32768:8:1$LkzTX35gqD7PUG78$5e6fb64796baa01f08bf36a387fde3ca5bfa232cc7141d68f2d6e142250e60a99a6bdf88e195aeeb7672a6d637fbf49a70cfa6b1cb2908f6f8c08d5d664ecedd	f
4	ALIEN-7WUO	\N	ji@gmail.com	scrypt:32768:8:1$wXeh76zaleI17k3L$5f9a1854f6cc9d35102150e806f90f22bf6877cbe1cca92d258da1532dcd605c6447d0adf88af599db155a849d32f896a684785e10a096fbc096d8b8e1d25b97	f
5	ALIEN-BNLW	\N	tester@test.com	scrypt:32768:8:1$BemsOoMdrHPZ0R3Y$808d2c63b46b91d1df92d9d3c79972167a4c2960665eb91f84d65f5a61fddd0714345b5ba39ae31350b723601f8b400118dbd983ffb4f95c1e3858692d6fc5ab	f
6	ALIEN-NMIQ	\N	alien@test.com	scrypt:32768:8:1$kzwGkgF10B7QRNat$1c6c341c880b57ff80a2d2554d3c6f91ceae3fcca5b26898a6365df03ee4a4efa3935f1daf20c0ce329274ba670624db2c3f2b2e69da03d2797973708211d5e5	f
7	ALIEN-T06G	\N	hey@gmail.com	scrypt:32768:8:1$u9aKG0TbvyccVwz0$b30d90a40c2c4cba92ddc98efd8df9928fa2042e1cfc0e0eb4ce03ef87a8832fe417c504380d5a419cfeaf1966f42c0da25ff7cd5db7aa76bc05701bdabd3daf	f
8	ALIEN-F4RV	SuccessAlien	success@gmail.com	scrypt:32768:8:1$Rz5wWOhJ5aCOE6pe$b6dbdb850691c095edf2798ef0d2ed9eeaceccbe4eefb742ba251cdd02804a8e9288c0b7a387314f26da5c31463865e071d168aa46bbad541887ba68b106569d	f
9	ALIEN-3U6T	hg ajwgfh	jas@gmail.com	scrypt:32768:8:1$78opPCLYL95k2W91$201652240bc070c40414ae02cbd5947016a5d10b52b4acf7a599c887a5dd8c51a919a6eb040db3c411e3477a8fbd6d7fb938eff5f42a0b214a90c78e1822af78	f
10	ALIEN-37LS	jas	ja@gmail.com	scrypt:32768:8:1$YnlotUGEdKh4Tt9I$d7c8032b06b508d5b35244975009f5508ec4b103eb79d65e1c448ed1078e926e2c4bfdd2e5a45e58556e1f1ea82c8eb316536e00c429fb950f5586a1907ffaf2	f
11	ALIEN-9IH2	UITest	ui_test@gmail.com	scrypt:32768:8:1$4azlZgdiVI2hAkj8$69824a8aa36bcbb5083e998224c25a1a0b139cd35544821f80089ee81a02647c5e687a72329e72dbe00c2d6ae95096a6d6e4c996d0cfb68ac9edbb1f72274d1a	f
12	ALIEN-VCWZ	Test Man	m_test@gmail.com	scrypt:32768:8:1$BHIiLoqjrv69iE22$c93e8231c7cbe9d0a163c72911f261007625aa4a17cf734f6772b952a3a5c2d3775b6e24dd72d97d8ca01dada23606dbd31cdf6e22d3b81f0dc680b81dfd2b53	f
13	ALIEN-3PZ5	Venky	hello@gmail.com	scrypt:32768:8:1$Zi87V9ou20Dj0mSq$b451fd19055866f2e5d1ca3c41c7cc696f42a7c9a203bf5056f63d7f766a33692cc383fa515c433d214045c3a7c0969b7e66b5a867c875891fa3790e30fa6c8f	f
14	ALIEN-P7JM	Bhanu	bhanu@gmail.com	scrypt:32768:8:1$s46QtywfrjYkI9oz$47cd2a3699c6b590aab224b9d36612d1cde9857f9e8f222f5073bdb003ad39aed1dfb315731d6fd7d2b46a96962c4f46cf9965db3a44cfcd07abc08bb182da8d	f
15	ALIEN-2KJA	Debug Alien	debug_alien_test@gmail.com	scrypt:32768:8:1$5roDUUX4KuZHnmZn$9167fee0fd70aec8895f183187fa72e9689d15e3c5a30f96e7b591c4b9abcc4a7dabb01489e43d82022bbcc1adb97eca527a70c7806c9bd75adfe9a2e7946ab2	f
16	ALIEN-7EO6	Jaswa	jaswa@gmail.com	scrypt:32768:8:1$kv7FEFlmK9xual1e$f2b1e99f481d099a7fbddc55f21ecb8ef883150cb8f91af4909934d5d478a4e68a834518a1200ef0da8b5197a9b3f6b2f7dac6d48ba559a2196ab7fea63993db	f
17	ALIEN-01VK	Ven	ven@gmail.com	scrypt:32768:8:1$4wch6B9vjXl82ic8$59e2c5f590bd6f8da2eba00d2770eef707fa9f9cf3ffc4b486604694f1c99562aac7f4416271765af22a1cba5e288bd90de3a0a6de69374c314f2ec005eb4e10	f
\.


--
-- Name: company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.company_id_seq', 7, true);


--
-- Name: idea_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.idea_id_seq', 80, true);


--
-- Name: message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.message_id_seq', 43, true);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_id_seq', 17, true);


--
-- Name: company company_company_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_company_name_key UNIQUE (company_name);


--
-- Name: company company_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_email_key UNIQUE (email);


--
-- Name: company company_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_pkey PRIMARY KEY (id);


--
-- Name: company company_website_url_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_website_url_key UNIQUE (website_url);


--
-- Name: idea idea_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.idea
    ADD CONSTRAINT idea_pkey PRIMARY KEY (id);


--
-- Name: message message_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_pkey PRIMARY KEY (id);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: user user_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_username_key UNIQUE (username);


--
-- Name: idea idea_recipient_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.idea
    ADD CONSTRAINT idea_recipient_company_id_fkey FOREIGN KEY (recipient_company_id) REFERENCES public.company(id);


--
-- Name: idea idea_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.idea
    ADD CONSTRAINT idea_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public."user"(id);


--
-- Name: message message_idea_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_idea_id_fkey FOREIGN KEY (idea_id) REFERENCES public.idea(id);


--
-- PostgreSQL database dump complete
--

