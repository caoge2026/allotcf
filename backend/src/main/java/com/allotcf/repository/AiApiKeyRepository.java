package com.allotcf.repository;

import com.allotcf.entity.AiApiKey;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiApiKeyRepository extends JpaRepository<AiApiKey, Long> {

    Optional<AiApiKey> findFirstByProviderIgnoreCaseAndEnabledTrueOrderByIdDesc(String provider);
}
