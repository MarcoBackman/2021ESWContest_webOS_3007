DO
$do$
DECLARE
   i integer;
   device_id integer[];
   total integer := 0;
   tempValue integer;
   fuel float;
BEGIN
	--retreive device id by user id
	device_id := ARRAY (
		SELECT webos_electronics.device_id FROM webos_electronics
		WHERE owner_number='1'
	);

	RAISE NOTICE 'Devices: %', device_id;

	--get value by device id
	FOREACH i IN ARRAY device_id
	LOOP
		--get value from webos_electronics_status
		tempValue := (SELECT webos_electronics_status.total_power_used
					  FROM public.webos_electronics_status
					  WHERE webos_electronics_status.data_retreived='FALSE'
					  AND webos_electronics_status.device_id=i);
		total := tempValue + total;

		--set retreival status to true on data_retreived
		UPDATE webos_electronics_status
		SET data_retreived = 'TRUE'
		WHERE (data_retreived='FALSE'
		AND webos_electronics_status.device_id = i);

	END LOOP;
	--set total value to summary
	--electricity
  tempValue := total;
	total := (SELECT total_used_elect
		     FROM "webOS_user"
		     WHERE user_id = '1' LIMIT 1);

	IF (total ISNULL) THEN
		total := 0;
	END IF;
  IF (tempValue ISNULL) THEN
    tempValue := 0;
  END IF;

	total := tempValue + total;
	UPDATE "webOS_user" SET total_used_elect = total WHERE user_id='1';
	RAISE NOTICE 'TOTAL: %', total;
	--fuel
	--get value from webos_electronics_status
	fuel := (SELECT total_fuel_used
			 FROM car_usage_summary
			 WHERE user_number = '1' LIMIT 1);
	RAISE NOTICE 'FUEL: %', fuel;
	UPDATE "webOS_user" SET total_used_fuel = fuel WHERE user_id='1';
END
$do$;
